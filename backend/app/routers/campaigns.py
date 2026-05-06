"""
Campaign management and publication routes using MongoDB via Motor.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks

from app.middleware.auth import get_current_user, get_client_id
from app.models.schemas import (
    CampaignCreate,
    CampaignResponse,
    CampaignUpdate,
    PaginatedResponse,
    EstadoCampania,
    PortalPublicationStatus,
)
from app.services.database import get_collection, get_db
from app.services.encryption import get_encryption_service
from app.services.portal_publisher.publisher_factory import get_publisher

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

def get_campaigns_collection():
    return get_collection("campaigns")

@router.get("", response_model=PaginatedResponse)
async def list_campaigns(
    estado: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_campaigns_collection),
) -> PaginatedResponse:
    """List campaigns with optional filtering."""
    try:
        query = {"client_id": client_id}

        if estado:
            query["estado"] = estado

        if empresa_id:
            query["empresa_id"] = empresa_id

        total = await collection.count_documents(query)

        skip = (page - 1) * per_page
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        docs = await cursor.to_list(length=per_page)

        campaigns = []
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            campaigns.append(_campaign_data_to_response(doc))

        return PaginatedResponse(
            data=campaigns,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        )

    except Exception as e:
        logger.error(f"Error listing campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to list campaigns")


@router.post("", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    campaign: CampaignCreate,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_campaigns_collection),
) -> CampaignResponse:
    """Create a new campaign."""
    try:
        now = datetime.utcnow()

        portals_col = get_collection("portals")
        portals_status = []
        
        for portal_id in campaign.portales:
            if ObjectId.is_valid(portal_id):
                portal_doc = await portals_col.find_one({"_id": ObjectId(portal_id)})
                if portal_doc:
                    portals_status.append({
                        "portal_id": portal_id,
                        "nombre_portal": portal_doc.get("nombre"),
                        "estado": "pendiente",
                        "costo_estimado": portal_doc.get("costo_base", 0.0),
                        "url_publicacion": None,
                        "id_externo": None,
                        "intentos": 0,
                        "ultimo_intento": None,
                        "error_msg": None,
                        "publicado_en": None,
                    })

        campaign_data = {
            "client_id": client_id,
            "vacante_id": campaign.vacante_id,
            "perfil_id": campaign.perfil_id,
            "empresa_id": campaign.empresa_id,
            "reclutador_id": user.get("uid"),
            "paises_activos": campaign.paises_activos,
            "portales": portals_status,
            "estado": EstadoCampania.BORRADOR.value,
            "costo_total": sum(p["costo_estimado"] for p in portals_status),
            "moneda": "USD",
            "fecha_inicio": campaign.fecha_inicio,
            "fecha_expiracion": campaign.fecha_expiracion,
            "pago_id": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await collection.insert_one(campaign_data)
        campaign_data["id"] = str(result.inserted_id)
        
        logger.info(f"Created campaign: {campaign_data['id']}")

        return _campaign_data_to_response(campaign_data)

    except Exception as e:
        logger.error(f"Error creating campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to create campaign")


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_campaigns_collection),
) -> CampaignResponse:
    """Get campaign by ID."""
    try:
        if not ObjectId.is_valid(campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")

        doc = await collection.find_one({"_id": ObjectId(campaign_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized campaign access: {campaign_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        doc["id"] = str(doc.pop("_id"))
        return _campaign_data_to_response(doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaign")


@router.post("/{campaign_id}/publish", response_model=CampaignResponse)
async def publish_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_campaigns_collection),
) -> CampaignResponse:
    """Publish campaign to all selected portals asynchronously."""
    try:
        if not ObjectId.is_valid(campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")

        doc = await collection.find_one({"_id": ObjectId(campaign_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized campaign publish: {campaign_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        if doc.get("estado") != EstadoCampania.BORRADOR.value:
            raise HTTPException(
                status_code=400,
                detail=f"Campaign must be in borrador status, current: {doc.get('estado')}",
            )

        await collection.update_one(
            {"_id": ObjectId(campaign_id)},
            {"$set": {
                "estado": EstadoCampania.PUBLICANDO.value,
                "updated_at": datetime.utcnow()
            }}
        )

        background_tasks.add_task(
            _publish_campaign_to_portals,
            campaign_id=campaign_id,
            client_id=client_id,
        )

        logger.info(f"Campaign {campaign_id} queued for publishing")

        updated_doc = await collection.find_one({"_id": ObjectId(campaign_id)})
        updated_doc["id"] = str(updated_doc.pop("_id"))

        return _campaign_data_to_response(updated_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to publish campaign")


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    update_data: CampaignUpdate,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_campaigns_collection),
) -> CampaignResponse:
    """Update campaign (e.g., cancel, extend expiration)."""
    try:
        if not ObjectId.is_valid(campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")

        doc = await collection.find_one({"_id": ObjectId(campaign_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized campaign update: {campaign_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        update_fields = {}
        if update_data.estado:
            update_fields["estado"] = update_data.estado.value
        if update_data.fecha_expiracion:
            update_fields["fecha_expiracion"] = update_data.fecha_expiracion

        if not update_fields:
            doc["id"] = str(doc.pop("_id"))
            return _campaign_data_to_response(doc)

        update_fields["updated_at"] = datetime.utcnow()

        await collection.update_one(
            {"_id": ObjectId(campaign_id)},
            {"$set": update_fields}
        )
        logger.info(f"Updated campaign: {campaign_id}")

        updated_doc = await collection.find_one({"_id": ObjectId(campaign_id)})
        updated_doc["id"] = str(updated_doc.pop("_id"))

        return _campaign_data_to_response(updated_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating campaign: {e}")
        raise HTTPException(status_code=500, detail="Failed to update campaign")


# ============================================================================
# Background Tasks
# ============================================================================

async def _publish_campaign_to_portals(campaign_id: str, client_id: str) -> None:
    """Asynchronous background task to publish campaign to all portals."""
    
    try:
        db = get_db()
        campaigns_col = db["campaigns"]
        vacancies_col = db["vacancies"]
        portals_col = db["portals"]

        campaign_doc = await campaigns_col.find_one({"_id": ObjectId(campaign_id)})
        if not campaign_doc:
            logger.error(f"Campaign not found: {campaign_id}")
            return

        vacancy_id = campaign_doc.get("vacante_id")
        vacancy_doc = await vacancies_col.find_one({"_id": ObjectId(vacancy_id)}) if ObjectId.is_valid(vacancy_id) else None
        
        if not vacancy_doc:
            logger.error(f"Vacancy not found: {vacancy_id}")
            return

        encryption_service = get_encryption_service()

        portals_status = campaign_doc.get("portales", [])
        updated_portals = []

        for portal_status in portals_status:
            try:
                portal_id = portal_status["portal_id"]

                portal_doc = await portals_col.find_one({"_id": ObjectId(portal_id)}) if ObjectId.is_valid(portal_id) else None
                
                if not portal_doc:
                    logger.warning(f"Portal not found: {portal_id}")
                    portal_status["estado"] = "error"
                    portal_status["error_msg"] = "Portal not found"
                    updated_portals.append(portal_status)
                    continue

                publisher = get_publisher(
                    portal_slug=portal_doc["slug"],
                    portal_config=portal_doc,
                    job_data=vacancy_doc,
                    encryption_service=encryption_service,
                )

                result = await publisher.publish()

                if result["success"]:
                    portal_status["estado"] = "publicada"
                    portal_status["url_publicacion"] = result["url"]
                    portal_status["id_externo"] = result["id_externo"]
                    portal_status["publicado_en"] = datetime.utcnow()
                    logger.info(f"Published to {portal_doc['nombre']}: {result['url']}")
                else:
                    portal_status["estado"] = "error"
                    portal_status["error_msg"] = result.get("error_msg")
                    logger.error(f"Failed to publish to {portal_doc['nombre']}: {result['error_msg']}")

            except Exception as e:
                logger.error(f"Error publishing to portal {portal_status['portal_id']}: {e}")
                portal_status["estado"] = "error"
                portal_status["error_msg"] = str(e)

            portal_status["intentos"] = portal_status.get("intentos", 0) + 1
            portal_status["ultimo_intento"] = datetime.utcnow()
            updated_portals.append(portal_status)

        all_success = all(p["estado"] == "publicada" for p in updated_portals)
        any_error = any(p["estado"] == "error" for p in updated_portals)

        if all_success:
            campaign_status = EstadoCampania.PUBLICADA.value
        elif any_error:
            campaign_status = EstadoCampania.ERROR.value
        else:
            campaign_status = EstadoCampania.PUBLICANDO.value

        await campaigns_col.update_one(
            {"_id": ObjectId(campaign_id)},
            {"$set": {
                "portales": updated_portals,
                "estado": campaign_status,
                "updated_at": datetime.utcnow(),
            }}
        )

        logger.info(f"Campaign {campaign_id} publishing completed with status: {campaign_status}")

    except Exception as e:
        logger.error(f"Error in campaign publishing task: {e}")
        try:
            db = get_db()
            await db["campaigns"].update_one(
                {"_id": ObjectId(campaign_id)},
                {"$set": {
                    "estado": EstadoCampania.ERROR.value,
                    "updated_at": datetime.utcnow(),
                }}
            )
        except Exception as update_err:
            logger.error(f"Failed to update campaign error status: {campaign_id} - {update_err}")


# ============================================================================
# Helper Functions
# ============================================================================

def _campaign_data_to_response(campaign_data: dict) -> CampaignResponse:
    """Convert campaign data dict to response model."""
    portals_response = [
        PortalPublicationStatus(**portal) for portal in campaign_data.get("portales", [])
    ]

    return CampaignResponse(
        id=campaign_data.get("id"),
        client_id=campaign_data.get("client_id"),
        vacante_id=campaign_data.get("vacante_id"),
        perfil_id=campaign_data.get("perfil_id"),
        empresa_id=campaign_data.get("empresa_id"),
        reclutador_id=campaign_data.get("reclutador_id"),
        paises_activos=campaign_data.get("paises_activos", []),
        portales=portals_response,
        estado=campaign_data.get("estado"),
        costo_total=campaign_data.get("costo_total", 0.0),
        moneda=campaign_data.get("moneda", "USD"),
        fecha_inicio=campaign_data.get("fecha_inicio"),
        fecha_expiracion=campaign_data.get("fecha_expiracion"),
        pago_id=campaign_data.get("pago_id"),
        created_at=campaign_data.get("created_at"),
        updated_at=campaign_data.get("updated_at"),
    )
