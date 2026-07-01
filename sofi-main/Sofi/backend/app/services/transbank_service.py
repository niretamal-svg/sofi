"""
Transbank Webpay Plus payment processing service.
Handles transaction creation and validation.
"""

import logging
from typing import Any, Optional
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.integration_type import IntegrationType
from transbank.common.options import Options

logger = logging.getLogger(__name__)


class TransbankService:
    """Service for Transbank Webpay Plus operations."""

    def __init__(self, commerce_code: Optional[str] = None, api_key: Optional[str] = None, environment: str = "integration"):
        """
        Initialize Transbank service.
        If commerce_code or api_key are missing, use testing environment credentials.
        """
        self.commerce_code = commerce_code
        self.api_key = api_key
        self.environment = environment.lower()

        # Options for configuration
        if self.commerce_code and self.api_key:
            integration_type = IntegrationType.LIVE if self.environment == "production" else IntegrationType.TEST
            self.options = Options(self.api_key, self.commerce_code, integration_type)
            self.tx = Transaction(self.options)
            logger.info(f"Initialized Transbank in {self.environment} mode.")
        else:
            # SDK defaults to Webpay Plus integration/testing credentials
            self.tx = Transaction()
            logger.info("Initialized Transbank using testing credentials.")

    def create_transaction(
        self,
        buy_order: str,
        session_id: str,
        amount: int,
        return_url: str,
    ) -> dict[str, Any]:
        """
        Create a new transaction in Webpay Plus.
        """
        try:
            response = self.tx.create(
                buy_order=buy_order,
                session_id=session_id,
                amount=amount,
                return_url=return_url
            )
            return {
                "token": response.get("token") or response.get("token_ws"),
                "url": response.get("url"),
            }
        except Exception as e:
            logger.error(f"Error creating Transbank transaction: {e}")
            raise

    def commit_transaction(self, token: str) -> dict[str, Any]:
        """
        Confirm a Webpay Plus transaction using the token returned by Transbank.
        """
        try:
            response = self.tx.commit(token)
            return {
                "status": response.get("status"),
                "response_code": response.get("response_code"),
                "amount": response.get("amount"),
                "buy_order": response.get("buy_order"),
                "session_id": response.get("session_id"),
                "card_detail": response.get("card_detail"),
                "accounting_date": response.get("accounting_date"),
                "transaction_date": response.get("transaction_date"),
                "payment_type_code": response.get("payment_type_code"),
                "vci": response.get("vci"),
            }
        except Exception as e:
            logger.error(f"Error confirming Transbank transaction: {e}")
            raise


# Global Transbank service instance
_transbank_service: TransbankService = None


def init_transbank(commerce_code: Optional[str] = None, api_key: Optional[str] = None, environment: str = "integration") -> TransbankService:
    """Initialize global Transbank service."""
    global _transbank_service
    _transbank_service = TransbankService(commerce_code, api_key, environment)
    return _transbank_service


def get_transbank_service() -> TransbankService:
    """Get global Transbank service instance."""
    global _transbank_service
    if _transbank_service is None:
        # Default initialization with test credentials
        _transbank_service = TransbankService()
    return _transbank_service
