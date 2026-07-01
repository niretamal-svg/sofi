"""
Job category management routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_client_id
from app.models.schemas import CategoryCreate, CategoryResponse, PaginatedResponse
from app.services.database import get_collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/categories", tags=["categories"])

def get_categories_collection():
    return get_collection("categories")

@router.get("", response_model=PaginatedResponse)
async def list_categories(
    client_id: str = Depends(get_client_id),
    collection = Depends(get_categories_collection),
) -> PaginatedResponse:
    """List all active job categories for the tenant."""
    try:
        cursor = collection.find(
            {"client_id": client_id, "activa": True}
        ).sort("orden", 1)
        
        docs = await cursor.to_list(length=1000)
        
        categories = []
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            categories.append(CategoryResponse(**doc))

        return PaginatedResponse(
            data=categories,
            total=len(categories),
            page=1,
            per_page=len(categories) or 10,
            total_pages=1,
        )

    except Exception as e:
        logger.error(f"Error listing categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to list categories")


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    category: CategoryCreate,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_categories_collection),
) -> CategoryResponse:
    """Create a new job category."""
    try:
        existing = await collection.find_one(
            {"client_id": client_id, "slug": category.slug}
        )

        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")

        category_data = {
            "client_id": client_id,
            "nombre": category.nombre,
            "slug": category.slug,
            "icono": category.icono,
            "orden": category.orden,
            "activa": True,
            "created_at": datetime.utcnow(),
        }

        result = await collection.insert_one(category_data)
        category_data["id"] = str(result.inserted_id)
        
        logger.info(f"Created category: {category_data['id']}")

        return CategoryResponse(**category_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    update_data: CategoryCreate,
    client_id: str = Depends(get_client_id),
    collection = Depends(get_categories_collection),
) -> CategoryResponse:
    """Update a job category."""
    try:
        if not ObjectId.is_valid(category_id):
            raise HTTPException(status_code=400, detail="Invalid category ID")

        doc = await collection.find_one({"_id": ObjectId(category_id)})

        if not doc:
            raise HTTPException(status_code=404, detail="Category not found")

        if str(doc.get("client_id")) != client_id:
            raise HTTPException(status_code=403, detail="Access denied")

        update_fields = {
            "nombre": update_data.nombre,
            "slug": update_data.slug,
            "icono": update_data.icono,
            "orden": update_data.orden,
            "updated_at": datetime.utcnow(),
        }

        await collection.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": update_fields}
        )
        logger.info(f"Updated category: {category_id}")

        updated_doc = await collection.find_one({"_id": ObjectId(category_id)})
        updated_doc["id"] = str(updated_doc.pop("_id"))

        return CategoryResponse(**updated_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to update category")
