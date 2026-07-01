"""
Authentication and user profile management routes using MongoDB via Motor.
"""

import logging
from datetime import datetime
from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user, get_client_id
from app.models.schemas import UserResponse
from app.services.database import get_collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

def get_users_collection():
    return get_collection("users")

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    user: dict = Depends(get_current_user),
    collection = Depends(get_users_collection),
) -> UserResponse:
    """Get current authenticated user's profile from MongoDB."""
    try:
        client_id = user.get("client_id")
        uid = user.get("uid")

        user_doc = await collection.find_one({"client_id": client_id, "uid": uid})

        if not user_doc:
            logger.warning(f"User profile not found for uid: {uid}, client: {client_id}")
            raise HTTPException(status_code=404, detail="User profile not found")

        user_doc["id"] = str(user_doc.pop("_id"))
        return UserResponse(**user_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile")


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: dict,
    user: dict = Depends(get_current_user),
    collection = Depends(get_users_collection),
) -> UserResponse:
    """Update current authenticated user's profile."""
    try:
        client_id = user.get("client_id")
        uid = user.get("uid")

        user_doc = await collection.find_one({"client_id": client_id, "uid": uid})

        if not user_doc:
            logger.warning(f"User profile not found for update: {uid}")
            raise HTTPException(status_code=404, detail="User profile not found")

        allowed_fields = {"nombre"}
        update_fields = {k: v for k, v in update_data.items() if k in allowed_fields}

        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        update_fields["updated_at"] = datetime.utcnow()

        await collection.update_one(
            {"_id": user_doc["_id"]},
            {"$set": update_fields}
        )
        logger.info(f"Updated user profile: {user_doc['_id']}")

        updated_doc = await collection.find_one({"_id": user_doc["_id"]})
        updated_doc["id"] = str(updated_doc.pop("_id"))

        return UserResponse(**updated_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")
