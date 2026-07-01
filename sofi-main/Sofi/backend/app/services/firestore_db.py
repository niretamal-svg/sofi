"""
Firestore database service for multi-tenant data persistence.
Initializes Firebase Admin SDK and provides database access.
"""

import logging
from typing import Any, Optional
import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)


class FirestoreService:
    """Service for Firestore database operations."""

    def __init__(self, firebase_credentials: dict, project_id: str):
        """
        Initialize Firestore service.

        Args:
            firebase_credentials: Firebase service account credentials dict
            project_id: Google Cloud project ID
        """
        self.project_id = project_id
        self.db = None
        self._init_firebase(firebase_credentials, project_id)

    def _init_firebase(self, firebase_credentials: dict, project_id: str):
        """Initialize Firebase Admin SDK."""
        try:
            # Check if already initialized
            try:
                firebase_admin.get_app()
            except ValueError:
                # Not initialized yet
                cred = credentials.Certificate(firebase_credentials)
                firebase_admin.initialize_app(cred, {"projectId": project_id})

            self.db = firestore.client()
            logger.info(f"Firestore initialized for project: {project_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise

    def get_client(self) -> firestore.Client:
        """Get Firestore client."""
        return self.db

    def doc_to_dict(self, doc: firestore.DocumentSnapshot) -> dict[str, Any]:
        """
        Convert Firestore document snapshot to dict with id field.

        Args:
            doc: Firestore DocumentSnapshot

        Returns:
            Dictionary with all fields plus 'id' field
        """
        data = doc.to_dict()
        if data:
            data["id"] = doc.id
        return data

    def doc_to_dict_or_none(self, doc: firestore.DocumentSnapshot) -> Optional[dict[str, Any]]:
        """
        Convert Firestore document snapshot to dict or return None if not exists.

        Args:
            doc: Firestore DocumentSnapshot

        Returns:
            Dictionary with all fields plus 'id' field, or None
        """
        if doc.exists:
            return self.doc_to_dict(doc)
        return None


# Global Firestore service instance
_firestore_service: FirestoreService = None


def init_firestore(firebase_credentials: dict, project_id: str) -> FirestoreService:
    """Initialize global Firestore service."""
    global _firestore_service
    _firestore_service = FirestoreService(firebase_credentials, project_id)
    return _firestore_service


def get_db() -> firestore.Client:
    """Get global Firestore client."""
    if _firestore_service is None:
        raise RuntimeError("Firestore service not initialized")
    return _firestore_service.get_client()


def get_firestore_service() -> FirestoreService:
    """Get global Firestore service instance."""
    if _firestore_service is None:
        raise RuntimeError("Firestore service not initialized")
    return _firestore_service
