"""
Job portal management routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_current_user, require_role, get_client_id
from app.models.schemas import (
    PortalCreate,
    PortalResponse,
    PortalCredentialsUpdate,
    PaginatedResponse,
)
from app.services.database import get_collection
from app.services.encryption import get_encryption_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portals", tags=["portals"])

def get_portals_collection():
    return get_collection("portals")

DEFAULT_PORTALS = [
    {
        "nombre": "LinkedIn",
        "slug": "linkedin",
        "url": "https://linkedin.com",
        "paises": ["GLOBAL"],
        "tipo": "social_network",
        "modelo_empresa": "freemium",
        "costo_base": 0.0,
        "moneda": "USD",
        "logo_url": "https://cdn-icons-png.flaticon.com/512/174/174857.png",
        "requires_login": True,
        "notas": "Portal base",
    },
    {
        "nombre": "Computrabajo MX",
        "slug": "computrabajo",
        "url": "https://www.computrabajo.com.mx",
        "paises": ["MX"],
        "tipo": "job_board",
        "modelo_empresa": "pago",
        "costo_base": 450.0,
        "moneda": "MXN",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base",
    },
    {
        "nombre": "Indeed",
        "slug": "indeed",
        "url": "https://indeed.com",
        "paises": ["GLOBAL"],
        "tipo": "job_board",
        "modelo_empresa": "gratis",
        "costo_base": 0.0,
        "moneda": "USD",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base",
    },
    {
        "nombre": "OCCMundial",
        "slug": "occ",
        "url": "https://www.occ.com.mx",
        "paises": ["MX"],
        "tipo": "job_board",
        "modelo_empresa": "pago",
        "costo_base": 800.0,
        "moneda": "MXN",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base",
    },
    {
        "nombre": "Portal del Empleo SNE",
        "slug": "sne",
        "url": "https://www.empleo.gob.mx",
        "paises": ["MX"],
        "tipo": "government",
        "modelo_empresa": "gratis",
        "costo_base": 0.0,
        "moneda": "MXN",
        "logo_url": None,
        "requires_login": False,
        "notas": "Portal base",
    },
    {
        "nombre": "Computrabajo Chile",
        "slug": "computrabajo-cl",
        "url": "https://www.computrabajo.cl",
        "paises": ["CL"],
        "tipo": "job_board",
        "modelo_empresa": "pago",
        "costo_base": 30000.0,
        "moneda": "CLP",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Chile",
    },
    {
        "nombre": "Laborum Chile",
        "slug": "laborum-cl",
        "url": "https://www.laborum.cl",
        "paises": ["CL"],
        "tipo": "job_board",
        "modelo_empresa": "pago",
        "costo_base": 35000.0,
        "moneda": "CLP",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Chile",
    },
    {
        "nombre": "Chiletrabajos",
        "slug": "chiletrabajos",
        "url": "https://www.chiletrabajos.cl",
        "paises": ["CL"],
        "tipo": "job_board",
        "modelo_empresa": "gratis",
        "costo_base": 0.0,
        "moneda": "CLP",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Chile",
    },
    {
        "nombre": "Trabajando Chile",
        "slug": "trabajando-cl",
        "url": "https://www.trabajando.cl",
        "paises": ["CL"],
        "tipo": "job_board",
        "modelo_empresa": "freemium",
        "costo_base": 0.0,
        "moneda": "CLP",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Chile",
    },
    {
        "nombre": "Tecoloco Guatemala",
        "slug": "tecoloco-gt",
        "url": "https://www.tecoloco.com.gt",
        "paises": ["GT"],
        "tipo": "job_board",
        "modelo_empresa": "freemium",
        "costo_base": 0.0,
        "moneda": "GTQ",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Guatemala",
    },
    {
        "nombre": "Computrabajo Guatemala",
        "slug": "computrabajo-gt",
        "url": "https://www.computrabajo.com.gt",
        "paises": ["GT"],
        "tipo": "job_board",
        "modelo_empresa": "pago",
        "costo_base": 300.0,
        "moneda": "GTQ",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Guatemala",
    },
    {
        "nombre": "Tecoloco Honduras",
        "slug": "tecoloco-hn",
        "url": "https://www.tecoloco.com.hn",
        "paises": ["HN"],
        "tipo": "job_board",
        "modelo_empresa": "freemium",
        "costo_base": 0.0,
        "moneda": "HNL",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Honduras",
    },
    {
        "nombre": "Tecoloco El Salvador",
        "slug": "tecoloco-sv",
        "url": "https://www.tecoloco.com.sv",
        "paises": ["SV"],
        "tipo": "job_board",
        "modelo_empresa": "freemium",
        "costo_base": 0.0,
        "moneda": "USD",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base El Salvador",
    },
    {
        "nombre": "Encuentra24 Nicaragua",
        "slug": "encuentra24-ni",
        "url": "https://www.encuentra24.com/nicaragua-es/empleos",
        "paises": ["NI"],
        "tipo": "classifieds",
        "modelo_empresa": "freemium",
        "costo_base": 0.0,
        "moneda": "NIO",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Nicaragua",
    },
    {
        "nombre": "ZipRecruiter",
        "slug": "ziprecruiter-us",
        "url": "https://www.ziprecruiter.com",
        "paises": ["US"],
        "tipo": "job_board",
        "modelo_empresa": "pago",
        "costo_base": 1200.0,
        "moneda": "USD",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Estados Unidos",
    },
    {
        "nombre": "Glassdoor",
        "slug": "glassdoor-us",
        "url": "https://www.glassdoor.com",
        "paises": ["US"],
        "tipo": "job_board",
        "modelo_empresa": "gratis",
        "costo_base": 0.0,
        "moneda": "USD",
        "logo_url": None,
        "requires_login": True,
        "notas": "Portal base Estados Unidos",
    },
]


async def ensure_default_portals(client_id: str, collection) -> None:
    now = datetime.utcnow()
    for portal in DEFAULT_PORTALS:
        await collection.update_one(
            {"client_id": client_id, "slug": portal["slug"]},
            {
                "$setOnInsert": {
                    **portal,
                    "client_id": client_id,
                    "activo": True,
                    "created_at": now,
                }
            },
            upsert=True,
        )

@router.get("", response_model=PaginatedResponse)
async def list_portals(
    paises: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_portals_collection),
) -> PaginatedResponse:
    """List job portals with optional filtering."""
    try:
        await ensure_default_portals(client_id, collection)

        query = {"client_id": client_id}

        if activo is not None:
            query["activo"] = activo

        if tipo:
            query["tipo"] = tipo

        if paises:
            paises_list = [p.strip() for p in paises.split(",")]
            query["paises"] = {"$in": paises_list}

        total = await collection.count_documents(query)

        skip = (page - 1) * per_page
        cursor = collection.find(query).sort("nombre", 1).skip(skip).limit(per_page)
        docs = await cursor.to_list(length=per_page)

        portals = []
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            portals.append(PortalResponse(**doc))

        return PaginatedResponse(
            data=portals,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        )

    except Exception as e:
        logger.error(f"Error listing portals: {e}")
        raise HTTPException(status_code=500, detail="Failed to list portals")


@router.post("", response_model=PortalResponse, status_code=201)
async def create_portal(
    portal: PortalCreate,
    user: dict = Depends(require_role("admin")),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_portals_collection),
) -> PortalResponse:
    """Create a new job portal (admin only)."""
    try:
        existing = await collection.find_one(
            {"client_id": client_id, "slug": portal.slug}
        )

        if existing:
            raise HTTPException(status_code=400, detail="Portal slug already exists")

        portal_data = {
            "client_id": client_id,
            "nombre": portal.nombre,
            "slug": portal.slug,
            "url": portal.url,
            "paises": portal.paises,
            "tipo": portal.tipo,
            "modelo_empresa": portal.modelo_empresa,
            "costo_base": portal.costo_base,
            "moneda": portal.moneda,
            "logo_url": portal.logo_url,
            "requires_login": portal.requires_login,
            "notas": portal.notas,
            "activo": True,
            "created_at": datetime.utcnow(),
        }

        result = await collection.insert_one(portal_data)
        portal_data["id"] = str(result.inserted_id)
        
        logger.info(f"Created portal: {portal_data['id']}")

        return PortalResponse(**portal_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating portal: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal")


@router.put("/{portal_id}", response_model=PortalResponse)
async def update_portal(
    portal_id: str,
    update_data: PortalCreate,
    user: dict = Depends(require_role("admin")),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_portals_collection),
) -> PortalResponse:
    """Update portal configuration (admin only)."""
    try:
        if not ObjectId.is_valid(portal_id):
            raise HTTPException(status_code=400, detail="Invalid portal ID")

        doc = await collection.find_one({"_id": ObjectId(portal_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Portal not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized portal update: {portal_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        update_fields = {
            "nombre": update_data.nombre,
            "slug": update_data.slug,
            "url": update_data.url,
            "paises": update_data.paises,
            "tipo": update_data.tipo,
            "modelo_empresa": update_data.modelo_empresa,
            "costo_base": update_data.costo_base,
            "moneda": update_data.moneda,
            "logo_url": update_data.logo_url,
            "requires_login": update_data.requires_login,
            "notas": update_data.notas,
            "updated_at": datetime.utcnow(),
        }

        await collection.update_one(
            {"_id": ObjectId(portal_id)},
            {"$set": update_fields}
        )
        logger.info(f"Updated portal: {portal_id}")

        updated_doc = await collection.find_one({"_id": ObjectId(portal_id)})
        updated_doc["id"] = str(updated_doc.pop("_id"))

        return PortalResponse(**updated_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating portal: {e}")
        raise HTTPException(status_code=500, detail="Failed to update portal")


@router.put("/{portal_id}/credentials")
async def update_portal_credentials(
    portal_id: str,
    credentials: PortalCredentialsUpdate,
    user: dict = Depends(require_role("admin")),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_portals_collection),
) -> dict:
    """Update encrypted portal login credentials (admin only)."""
    try:
        if not ObjectId.is_valid(portal_id):
            raise HTTPException(status_code=400, detail="Invalid portal ID")

        doc = await collection.find_one({"_id": ObjectId(portal_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Portal not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized credentials update: {portal_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        encryption_service = get_encryption_service()
        encrypted_username = encryption_service.encrypt(credentials.username)
        encrypted_password = encryption_service.encrypt(credentials.password)

        update_fields = {
            "username_encrypted": encrypted_username,
            "password_encrypted": encrypted_password,
            "updated_at": datetime.utcnow(),
        }

        await collection.update_one(
            {"_id": ObjectId(portal_id)},
            {"$set": update_fields}
        )
        logger.info(f"Updated credentials for portal: {portal_id}")

        return {"message": "Credentials updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating portal credentials: {e}")
        raise HTTPException(status_code=500, detail="Failed to update credentials")
