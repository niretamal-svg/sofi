"""
Job profile management and AI generation routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from typing import Optional
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_current_user, get_client_id
from app.models.schemas import (
    JobProfileCreate,
    JobProfileResponse,
    AIProfileRequest,
    AIProfileResponse,
    PaginatedResponse,
)
from app.services.database import get_collection
from app.services.gemini import get_gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profiles", tags=["profiles"])

def get_profiles_collection():
    return get_collection("job_profiles")

@router.get("", response_model=PaginatedResponse)
async def list_profiles(
    empresa_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_profiles_collection),
) -> PaginatedResponse:
    """List job profiles with optional company filter."""
    try:
        query = {"client_id": client_id}

        if empresa_id:
            query["empresa_id"] = empresa_id

        total = await collection.count_documents(query)

        skip = (page - 1) * per_page
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        docs = await cursor.to_list(length=per_page)

        profiles = []
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            profiles.append(JobProfileResponse(**doc))

        return PaginatedResponse(
            data=profiles,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        )

    except Exception as e:
        logger.error(f"Error listing job profiles: {e}")
        raise HTTPException(status_code=500, detail="Failed to list profiles")


@router.post("", response_model=JobProfileResponse, status_code=201)
async def create_profile(
    profile: JobProfileCreate,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_profiles_collection),
) -> JobProfileResponse:
    """Create a new job profile."""
    try:
        profile_data = {
            "client_id": client_id,
            "empresa_id": profile.empresa_id,
            "nombre_perfil": profile.nombre_perfil,
            "titulo_anuncio": profile.titulo_anuncio,
            "categoria_id": profile.categoria_id,
            "tipo_jornada": profile.tipo_jornada,
            "salario_min": profile.salario_min,
            "salario_max": profile.salario_max,
            "moneda": profile.moneda,
            "ubicacion": profile.ubicacion,
            "descripcion": profile.descripcion,
            "requisitos": profile.requisitos,
            "beneficios": profile.beneficios,
            "generado_por_ia": False,
            "ia_chips": [],
            "tono": None,
            "veces_usado": 0,
            "ultimo_uso": None,
            "generado_por": user.get("uid"),
            "created_at": datetime.utcnow(),
        }

        result = await collection.insert_one(profile_data)
        profile_data["id"] = str(result.inserted_id)
        
        logger.info(f"Created job profile: {profile_data['id']}")

        return JobProfileResponse(**profile_data)

    except Exception as e:
        logger.error(f"Error creating job profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to create profile")


@router.get("/{profile_id}", response_model=JobProfileResponse)
async def get_profile(
    profile_id: str,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_profiles_collection),
) -> JobProfileResponse:
    """Get job profile by ID."""
    try:
        if not ObjectId.is_valid(profile_id):
            raise HTTPException(status_code=400, detail="Invalid profile ID")

        doc = await collection.find_one({"_id": ObjectId(profile_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Profile not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized profile access: {profile_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        doc["id"] = str(doc.pop("_id"))
        return JobProfileResponse(**doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")


@router.post("/ai/generate", response_model=AIProfileResponse)
async def generate_ai_profile(
    request: AIProfileRequest,
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
) -> AIProfileResponse:
    """Generate a job profile using Google Gemini AI."""
    try:
        gemini_service = get_gemini_service()

        result = await gemini_service.generate_job_profile(
            job_title=request.job_title,
            company_name=request.company_name,
            experience_level=request.experience_level.value,
            job_type=request.job_type.value,
            tone=request.tone,
            industry=request.industry,
            additional_context=request.additional_context,
        )

        logger.info(f"Generated job profile via AI for: {request.job_title}")
        return AIProfileResponse(**result)

    except Exception as e:
        logger.error(f"Error generating AI profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate profile")


@router.post("/ai/generate-and-save", response_model=JobProfileResponse, status_code=201)
async def generate_and_save_ai_profile(
    request: AIProfileRequest,
    empresa_id: str = Query(...),
    categoria_id: str = Query(...),
    user: dict = Depends(get_current_user),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_profiles_collection),
) -> JobProfileResponse:
    """Generate a job profile using AI and save it to MongoDB."""
    try:
        gemini_service = get_gemini_service()

        ai_result = await gemini_service.generate_job_profile(
            job_title=request.job_title,
            company_name=request.company_name,
            experience_level=request.experience_level.value,
            job_type=request.job_type.value,
            tone=request.tone,
            industry=request.industry,
            additional_context=request.additional_context,
        )

        profile_data = {
            "client_id": client_id,
            "empresa_id": empresa_id,
            "nombre_perfil": ai_result.get("titulo_anuncio", request.job_title),
            "titulo_anuncio": ai_result.get("titulo_anuncio"),
            "categoria_id": categoria_id,
            "tipo_jornada": request.job_type.value,
            "descripcion": ai_result.get("descripcion"),
            "requisitos": ai_result.get("requisitos", []),
            "beneficios": ai_result.get("beneficios", []),
            "generado_por_ia": True,
            "ia_chips": ai_result.get("ia_chips", []),
            "tono": request.tone,
            "veces_usado": 0,
            "ultimo_uso": None,
            "generado_por": user.get("uid"),
            "created_at": datetime.utcnow(),
        }

        result = await collection.insert_one(profile_data)
        profile_data["id"] = str(result.inserted_id)
        
        logger.info(f"Created AI-generated profile: {profile_data['id']}")

        return JobProfileResponse(**profile_data)

    except Exception as e:
        logger.error(f"Error generating and saving AI profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate profile")
