"""
Encryption service for storing sensitive credentials.
Uses Fernet (symmetric encryption) for encrypting/decrypting portal credentials.
"""

import logging
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""

    def __init__(self, encryption_key: str):
        """
        Initialize encryption service with Fernet key.

        Args:
            encryption_key: Base64-encoded Fernet key
        """
        try:
            self.cipher = Fernet(encryption_key.encode())
        except Exception as e:
            logger.error(f"Failed to initialize Fernet cipher: {e}")
            raise ValueError("Invalid encryption key format")

    def encrypt(self, text: str) -> str:
        """
        Encrypt plaintext string.

        Args:
            text: Plaintext to encrypt

        Returns:
            Base64-encoded encrypted token
        """
        try:
            encrypted = self.cipher.encrypt(text.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, token: str) -> str:
        """
        Decrypt encrypted token.

        Args:
            token: Base64-encoded encrypted token

        Returns:
            Decrypted plaintext string
        """
        try:
            decrypted = self.cipher.decrypt(token.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Failed to decrypt token - may be corrupted or using wrong key")


# Global encryption service instance
_encryption_service: EncryptionService = None


def init_encryption(encryption_key: str) -> EncryptionService:
    """Initialize global encryption service."""
    global _encryption_service
    _encryption_service = EncryptionService(encryption_key)
    return _encryption_service


def get_encryption_service() -> EncryptionService:
    """Get global encryption service instance."""
    if _encryption_service is None:
        raise RuntimeError("Encryption service not initialized")
    return _encryption_service
