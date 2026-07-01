"""
Company management routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from typing import Optional
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_client_id
from app.models.schemas import CompanyCreate, CompanyResponse, PaginatedResponse
from app.services.database import get_collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["companies"])

def get_companies_collection():
    return get_collection("companies")

@router.get("", response_model=PaginatedResponse)
async def list_companies(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    client_id: str = Depends(get_client_id),
    collection = Depends(get_companies_collection),
) -> PaginatedResponse:
    """List all companies for the tenant."""
    try:
        query = {"client_id": client_id, "activa": True}
        
        total = await collection.count_documents(query)

        skip = (page - 1) * per_page
        cursor = collection.find(query).sort("nombre", 1).skip(skip).limit(per_page)
        docs = await cursor.to_list(length=per_page)

        companies = []
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            companies.append(CompanyResponse(**doc))

        return PaginatedResponse(
            data=companies,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        )

    except Exception as e:
        logger.error(f"Error listing companies: {e}")
        raise HTTPException(status_code=500, detail="Failed to list companies")


@router.post("", response_model=CompanyResponse, status_code=201)
async def create_company(
    company: CompanyCreate,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_companies_collection),
) -> CompanyResponse:
    """Create a new company."""
    try:
        company_data = {
            "client_id": client_id,
            "nombre": company.nombre,
            "rfc": company.rfc,
            "pais": company.pais,
            "logo_url": company.logo_url,
            "activa": True,
            "created_at": datetime.utcnow(),
        }

        result = await collection.insert_one(company_data)
        company_data["id"] = str(result.inserted_id)
        
        logger.info(f"Created company: {company_data['id']}")

        return CompanyResponse(**company_data)

    except Exception as e:
        logger.error(f"Error creating company: {e}")
        raise HTTPException(status_code=500, detail="Failed to create company")


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_companies_collection),
) -> CompanyResponse:
    """Get company by ID."""
    try:
        if not ObjectId.is_valid(company_id):
            raise HTTPException(status_code=400, detail="Invalid company ID")

        doc = await collection.find_one({"_id": ObjectId(company_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Company not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized company access: {company_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        doc["id"] = str(doc.pop("_id"))
        return CompanyResponse(**doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch company")


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    update_data: CompanyCreate,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_companies_collection),
) -> CompanyResponse:
    """Update company information."""
    try:
        if not ObjectId.is_valid(company_id):
            raise HTTPException(status_code=400, detail="Invalid company ID")

        doc = await collection.find_one({"_id": ObjectId(company_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Company not found")

        if str(doc.get("client_id")) != client_id:
            logger.warning(f"Unauthorized company update: {company_id}")
            raise HTTPException(status_code=403, detail="Access denied")

        update_fields = {
            "nombre": update_data.nombre,
            "rfc": update_data.rfc,
            "pais": update_data.pais,
            "logo_url": update_data.logo_url,
            "updated_at": datetime.utcnow(),
        }

        await collection.update_one(
            {"_id": ObjectId(company_id)},
            {"$set": update_fields}
        )
        logger.info(f"Updated company: {company_id}")

        updated_doc = await collection.find_one({"_id": ObjectId(company_id)})
        updated_doc["id"] = str(updated_doc.pop("_id"))

        return CompanyResponse(**updated_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company: {e}")
        raise HTTPException(status_code=500, detail="Failed to update company")
