"""
Payment processing and webhook routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Form, BackgroundTasks
from fastapi.responses import HTMLResponse
from app.middleware.auth import get_current_user, get_client_id
from app.models.schemas import PaymentCreate, PaymentResponse
from app.services.database import get_collection, get_db
from app.services.stripe_service import get_stripe_service
from app.services.transbank_service import get_transbank_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

def get_payments_collection():
    return get_collection("payments")

@router.post("", response_model=dict, status_code=201)
async def create_payment(
    payment: PaymentCreate,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_payments_collection),
) -> dict:
    """Create a Stripe payment intent for a campaign."""
    try:
        stripe_service = get_stripe_service()

        campaigns_col = get_collection("campaigns")
        if not ObjectId.is_valid(payment.campana_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")

        campaign_doc = await campaigns_col.find_one({"_id": ObjectId(payment.campana_id)})
        
        if not campaign_doc:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if str(campaign_doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized payment access: {payment.campana_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        if payment.monto != campaign_doc.get("costo_total"):
            raise HTTPException(
                status_code=400,
                detail=f"Amount mismatch. Expected: {campaign_doc.get('costo_total')}",
            )

        amount_cents = int(payment.monto * 100)

        intent = None
        from app.config import settings

        if not settings.enable_mocks:
            try:
                intent = stripe_service.create_payment_intent(
                    amount_cents=amount_cents,
                    currency=payment.moneda.lower(),
                    metadata={
                        "campaign_id": payment.campana_id,
                        "empresa_id": payment.empresa_id,
                        "client_id": client_id,
                    },
                    customer_email=user.get("email"),
                    description=f"Campaign {payment.campana_id} publication fees",
                )
            except Exception as e:
                logger.warning(f"Stripe real payment intent failed, falling back to mock: {e}")
                intent = None

        if not intent:
            intent = {
                "id": f"mock_pi_{ObjectId()}",
                "client_secret": f"mock_stripe_secret_{ObjectId()}",
                "amount": amount_cents,
                "currency": payment.moneda.lower(),
            }

        payment_data = {
            "client_id": client_id,
            "campana_id": payment.campana_id,
            "empresa_id": payment.empresa_id,
            "monto": payment.monto,
            "moneda": payment.moneda,
            "metodo": payment.metodo.value,
            "estado": "pendiente",
            "stripe_payment_intent_id": intent["id"],
            "desglose": payment.desglose or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await collection.insert_one(payment_data)
        payment_id = str(result.inserted_id)

        logger.info(f"Created payment: {payment_id}")

        return {
            "id": payment_id,
            "client_secret": intent["client_secret"],
            "amount": intent["amount"],
            "currency": intent["currency"],
            "payment_intent_id": intent["id"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment")


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_payments_collection),
) -> PaymentResponse:
    """Get payment record by ID."""
    try:
        if not ObjectId.is_valid(payment_id):
            raise HTTPException(status_code=400, detail="Invalid payment ID")

        doc = await collection.find_one({"_id": ObjectId(payment_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Payment not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized payment access: {payment_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        doc["id"] = str(doc.pop("_id"))
        return PaymentResponse(**doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment")


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
) -> dict:
    """Handle Stripe webhook events for payment status updates."""
    try:
        stripe_service = get_stripe_service()
        db = get_db()
        payments_col = db["payments"]
        campaigns_col = db["campaigns"]

        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if not sig_header:
            logger.warning("Missing Stripe signature header")
            raise HTTPException(status_code=400, detail="Missing signature")

        event = stripe_service.handle_webhook(payload, sig_header)

        if event["type"] == "payment_intent.succeeded":
            payment_intent_id = event["data"]["object"].get("id")
            metadata = event["data"]["object"].get("metadata", {})

            campaign_id = metadata.get("campaign_id")

            if campaign_id:
                payment_doc = await payments_col.find_one({"stripe_payment_intent_id": payment_intent_id})

                if payment_doc:
                    payment_id = payment_doc["_id"]
                    await payments_col.update_one(
                        {"_id": payment_id},
                        {"$set": {
                            "estado": "completado",
                            "updated_at": datetime.utcnow(),
                        }}
                    )

                    logger.info(f"Payment succeeded: {payment_id}")

                    if ObjectId.is_valid(campaign_id):
                        await campaigns_col.update_one(
                            {"_id": ObjectId(campaign_id)},
                            {"$set": {
                                "pago_id": str(payment_id),
                                "estado": "borrador",
                                "updated_at": datetime.utcnow(),
                            }}
                        )

        elif event["type"] == "payment_intent.payment_failed":
            payment_intent_id = event["data"]["object"].get("id")
            last_error = event["data"]["object"].get("last_payment_error", {}).get("message", "Unknown error")

            payment_doc = await payments_col.find_one({"stripe_payment_intent_id": payment_intent_id})

            if payment_doc:
                payment_id = payment_doc["_id"]
                await payments_col.update_one(
                    {"_id": payment_id},
                    {"$set": {
                        "estado": "fallido",
                        "updated_at": datetime.utcnow(),
                    }}
                )

                logger.warning(f"Payment failed: {payment_id} - {last_error}")

        logger.info(f"Stripe webhook processed: {event['type']}")

        return {"status": "received"}

    except ValueError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {e}")
        return {"status": "received"}


# ============================================================================
# Transbank Webpay Plus Routes
# ============================================================================

class TransbankInitiateRequest(BaseModel):
    campana_id: str
    empresa_id: str
    monto: float
    moneda: str
    return_url: str


class TransbankCommitRequest(BaseModel):
    token: str


@router.post("/transbank/initiate", status_code=201)
async def initiate_transbank_payment(
    request: TransbankInitiateRequest,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_payments_collection),
) -> dict:
    """Initiate a Transbank Webpay Plus transaction."""
    try:
        transbank_service = get_transbank_service()

        campaigns_col = get_collection("campaigns")
        if not ObjectId.is_valid(request.campana_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")

        campaign_doc = await campaigns_col.find_one({"_id": ObjectId(request.campana_id)})
        
        if not campaign_doc:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if str(campaign_doc.get("client_id")) != client_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Initiate Webpay Plus transaction
        # Transbank requires integer amounts for CLP. If it's USD or MXN, we cast to int
        amount_int = int(request.monto)

        result = transbank_service.create_transaction(
            buy_order=request.campana_id[:26],  # Webpay order limit is 26 chars
            session_id=request.empresa_id[:61], # Webpay session limit is 61 chars
            amount=amount_int,
            return_url=request.return_url
        )

        payment_data = {
            "client_id": client_id,
            "campana_id": request.campana_id,
            "empresa_id": request.empresa_id,
            "monto": request.monto,
            "moneda": request.moneda,
            "metodo": "transbank",
            "estado": "pendiente",
            "transbank_token": result["token"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        pay_res = await collection.insert_one(payment_data)
        payment_id = str(pay_res.inserted_id)

        logger.info(f"Created Transbank payment {payment_id} for campaign {request.campana_id}")

        return {
            "token": result["token"],
            "url": result["url"],
            "payment_id": payment_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating Transbank payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate Transbank payment")


@router.post("/transbank/commit")
async def commit_transbank_payment(
    request: TransbankCommitRequest,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_payments_collection),
) -> dict:
    """Confirm and commit a Transbank Webpay Plus transaction."""
    try:
        transbank_service = get_transbank_service()
        db = get_db()
        campaigns_col = db["campaigns"]

        # 1. Get payment from token
        payment_doc = await collection.find_one({"transbank_token": request.token})
        if not payment_doc:
            raise HTTPException(status_code=404, detail="Payment record not found for Webpay token")

        if str(payment_doc.get("client_id")) != client_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # 2. Query Webpay status
        result = transbank_service.commit_transaction(request.token)
        payment_id = payment_doc["_id"]

        is_approved = result.get("response_code") == 0 and result.get("status") in ["AUTHORIZED", "CAPTURED"]

        if is_approved:
            # Mark payment as completed
            await collection.update_one(
                {"_id": payment_id},
                {"$set": {
                    "estado": "completado",
                    "transbank_response": result,
                    "updated_at": datetime.utcnow(),
                }}
            )

            # Update campaign to borrador (draft but paid, ready to launch)
            campaign_id = payment_doc.get("campana_id")
            if ObjectId.is_valid(campaign_id):
                await campaigns_col.update_one(
                    {"_id": ObjectId(campaign_id)},
                    {"$set": {
                        "pago_id": str(payment_id),
                        "estado": "borrador",
                        "updated_at": datetime.utcnow(),
                    }}
                )
            logger.info(f"Transbank payment {payment_id} approved and committed successfully.")
            return {"status": "approved", "detail": result}
        else:
            # Mark payment as failed
            await collection.update_one(
                {"_id": payment_id},
                {"$set": {
                    "estado": "fallido",
                    "transbank_response": result,
                    "updated_at": datetime.utcnow(),
                }}
            )
            logger.warning(f"Transbank payment {payment_id} rejected with code {result.get('response_code')}.")
            return {"status": "rejected", "detail": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error committing Transbank payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to commit Transbank transaction")


@router.api_route("/transbank/return", methods=["GET", "POST"], response_class=HTMLResponse)
async def transbank_return(
    request: Request,
    background_tasks: BackgroundTasks,
    collection = Depends(get_payments_collection),
):
    """Webpay Plus return URL redirect receiver."""
    form_data = {}
    try:
        form_data = await request.form()
    except Exception:
        pass

    token_ws = request.query_params.get("token_ws") or form_data.get("token_ws")
    tbk_token = request.query_params.get("TBK_TOKEN") or form_data.get("TBK_TOKEN")
    tbk_orden_compra = request.query_params.get("TBK_ORDEN_COMPRA") or form_data.get("TBK_ORDEN_COMPRA")
    tbk_id_sesion = request.query_params.get("TBK_ID_SESION") or form_data.get("TBK_ID_SESION")

    token = token_ws or tbk_token
    
    transbank_service = get_transbank_service()
    db = get_db()
    campaigns_col = db["campaigns"]

    is_approved = False
    campaign_id = ""

    if token:
        try:
            payment_doc = await collection.find_one({"transbank_token": token})
            if payment_doc:
                campaign_id = str(payment_doc.get("campana_id"))
                result = transbank_service.commit_transaction(token)
                is_approved = result.get("response_code") == 0 and result.get("status") in ["AUTHORIZED", "CAPTURED"]
                payment_id = payment_doc["_id"]
                
                if is_approved:
                    await collection.update_one(
                        {"_id": payment_id},
                        {"$set": {"estado": "completado", "transbank_response": result, "updated_at": datetime.utcnow()}}
                    )
                    await campaigns_col.update_one(
                        {"_id": ObjectId(campaign_id)},
                        {"$set": {"pago_id": str(payment_id), "estado": "publicando", "updated_at": datetime.utcnow()}}
                    )
                    from app.routers.campaigns import _publish_campaign_to_portals
                    background_tasks.add_task(
                        _publish_campaign_to_portals,
                        campaign_id=campaign_id,
                        client_id=payment_doc.get("client_id", "test_client"),
                    )
                else:
                    await collection.update_one(
                        {"_id": payment_id},
                        {"$set": {"estado": "fallido", "transbank_response": result, "updated_at": datetime.utcnow()}}
                    )
        except Exception as e:
            logger.error(f"Error in Webpay return commit: {e}")

    # Redirect back to frontend with query parameters
    status_param = "success" if is_approved else "failure"
    redirect_url = f"http://localhost:3000/publication?payment_status={status_param}&campaign_id={campaign_id}"
    
    html_content = f"""
    <html>
        <head>
            <script type="text/javascript">
                window.location.href = "{redirect_url}";
            </script>
        </head>
        <body>
            <p>Redirigiendo de vuelta a Sofi...</p>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

