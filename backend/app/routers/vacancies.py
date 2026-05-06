"""
Job vacancy management routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_current_user, get_client_id
from app.models.schemas import (
    VacancyCreate,
    VacancyResponse,
    VacancyUpdate,
    PaginatedResponse,
)
from app.services.database import get_collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vacancies", tags=["vacancies"])

def get_vacancies_collection():
    return get_collection("vacancies")

@router.get("", response_model=PaginatedResponse)
async def list_vacancies(
    empresa_id: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_vacancies_collection),
) -> PaginatedResponse:
    """List vacancies with optional filtering."""
    try:
        query = {"client_id": client_id}

        if empresa_id:
            query["empresa_id"] = empresa_id
        if estado:
            query["estado"] = estado
        if q:
            query["nombre"] = {"$regex": q, "$options": "i"}

        total = await collection.count_documents(query)

        skip = (page - 1) * per_page
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        docs = await cursor.to_list(length=per_page)

        vacancies = []
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            vacancies.append(VacancyResponse(**doc))

        return PaginatedResponse(
            data=vacancies,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        )

    except Exception as e:
        logger.error(f"Error listing vacancies: {e}")
        raise HTTPException(status_code=500, detail="Failed to list vacancies")


@router.post("", response_model=VacancyResponse, status_code=201)
async def create_vacancy(
    vacancy: VacancyCreate,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_vacancies_collection),
) -> VacancyResponse:
    """Create a new vacancy."""
    try:
        now = datetime.utcnow()

        vacancy_data = {
            "client_id": client_id,
            "empresa_id": vacancy.empresa_id,
            "codigo": vacancy.codigo,
            "nombre": vacancy.nombre,
            "categoria_id": vacancy.categoria_id,
            "descripcion": vacancy.descripcion,
            "proposito": vacancy.proposito,
            "direccion": vacancy.direccion,
            "estado": vacancy.estado,
            "preguntas": vacancy.preguntas or [],
            "reclutador_id": user.get("uid"),
            "vigente": vacancy.estado == "vigente",
            "creado_por": user.get("uid"),
            "created_at": now,
            "updated_at": now,
        }

        result = await collection.insert_one(vacancy_data)
        vacancy_data["id"] = str(result.inserted_id)
        logger.info(f"Created vacancy: {vacancy_data['id']}")

        return VacancyResponse(**vacancy_data)

    except Exception as e:
        logger.error(f"Error creating vacancy: {e}")
        raise HTTPException(status_code=500, detail="Failed to create vacancy")


@router.get("/{vacancy_id}", response_model=VacancyResponse)
async def get_vacancy(
    vacancy_id: str,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_vacancies_collection),
) -> VacancyResponse:
    """Get vacancy by ID."""
    try:
        if not ObjectId.is_valid(vacancy_id):
            raise HTTPException(status_code=400, detail="Invalid vacancy ID")

        doc = await collection.find_one({"_id": ObjectId(vacancy_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Vacancy not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized vacancy access: {vacancy_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        doc["id"] = str(doc.pop("_id"))
        return VacancyResponse(**doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching vacancy: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch vacancy")


@router.put("/{vacancy_id}", response_model=VacancyResponse)
async def update_vacancy(
    vacancy_id: str,
    update_data: VacancyUpdate,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_vacancies_collection),
) -> VacancyResponse:
    """Update vacancy."""
    try:
        if not ObjectId.is_valid(vacancy_id):
            raise HTTPException(status_code=400, detail="Invalid vacancy ID")

        doc = await collection.find_one({"_id": ObjectId(vacancy_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Vacancy not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized vacancy update: {vacancy_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        update_fields = {k: v for k, v in update_data.dict(exclude_unset=True).items()}
        if not update_fields:
            doc["id"] = str(doc.pop("_id"))
            return VacancyResponse(**doc)

        update_fields["updated_at"] = datetime.utcnow()

        if "estado" in update_fields:
            update_fields["vigente"] = update_fields["estado"] == "vigente"

        await collection.update_one(
            {"_id": ObjectId(vacancy_id)},
            {"$set": update_fields}
        )
        logger.info(f"Updated vacancy: {vacancy_id}")

        updated_doc = await collection.find_one({"_id": ObjectId(vacancy_id)})
        updated_doc["id"] = str(updated_doc.pop("_id"))

        return VacancyResponse(**updated_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating vacancy: {e}")
        raise HTTPException(status_code=500, detail="Failed to update vacancy")
