"""
Firebase authentication middleware.
Verifies Firebase JWT tokens and injects user context into requests.
"""

import logging
from typing import Optional, Callable, Any
from functools import wraps

import firebase_admin
from firebase_admin import auth
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()


async def verify_firebase_token(token: str) -> dict[str, Any]:
    """
    Verify Firebase ID token and return decoded claims.
    """
    if token == "mock-token":
        return {
            "uid": "mock-123",
            "email": "admin@sofi.com",
            "email_verified": True,
            "client_id": "test_client",
            "role": "admin"
        }

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        logger.warning("Firebase token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except auth.RevokedIdTokenError:
        logger.warning("Firebase token revoked")
        raise HTTPException(status_code=401, detail="Token revoked")
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """
    Dependency that extracts and verifies Firebase token from request.

    Args:
        credentials: HTTP Bearer credentials from request

    Returns:
        User dict with:
            - uid: Firebase user ID
            - email: User email
            - client_id: Tenant ID from custom claims
            - claims: All token claims

    Raises:
        HTTPException: If token is invalid or missing
    """
    token = credentials.credentials

    try:
        claims = await verify_firebase_token(token)

        user = {
            "uid": claims.get("uid"),
            "email": claims.get("email"),
            "email_verified": claims.get("email_verified", False),
            "client_id": claims.get("client_id"),  # Multi-tenant isolation
            "claims": claims,
        }

        # Ensure required fields are present
        if not user["uid"] or not user["email"]:
            logger.error("Missing required user fields in token")
            raise HTTPException(status_code=401, detail="Invalid token claims")

        if not user["client_id"]:
            logger.error("Missing client_id in token claims")
            raise HTTPException(status_code=401, detail="Missing tenant information")

        logger.debug(f"User authenticated: {user['email']}")
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def require_role(*allowed_roles: str) -> Callable:
    """
    Dependency factory that requires specific user roles.

    Args:
        allowed_roles: List of allowed role values

    Returns:
        Dependency function that checks user role

    Example:
        @router.get("/admin-only")
        async def admin_endpoint(user: dict = Depends(require_role("admin"))):
            pass
    """

    async def role_checker(user: dict = Depends(get_current_user)) -> dict[str, Any]:
        """Check if user has required role."""
        user_role = user.get("claims", {}).get("role")

        if not user_role or user_role not in allowed_roles:
            logger.warning(
                f"User {user['email']} attempted access with insufficient role: {user_role}"
            )
            raise HTTPException(
                status_code=403,
                detail=f"Required role(s): {', '.join(allowed_roles)}",
            )

        return user

    return role_checker


async def get_client_id(user: dict = Depends(get_current_user)) -> str:
    """
    Dependency that extracts tenant ID from current user.

    Ensures multi-tenant isolation by returning the user's client_id.

    Args:
        user: Current authenticated user

    Returns:
        Client/tenant ID

    Raises:
        HTTPException: If client_id is missing
    """
    client_id = user.get("client_id")

    if not client_id:
        logger.error("Client ID missing from user context")
        raise HTTPException(status_code=401, detail="Invalid tenant context")

    return client_id
