"""
Payment processing and webhook routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Request

from app.middleware.auth import get_current_user, get_client_id
from app.models.schemas import PaymentCreate, PaymentResponse
from app.services.database import get_collection, get_db
from app.services.stripe_service import get_stripe_service

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
                                "estado": "pendiente_pago",
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
