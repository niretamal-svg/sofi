"""
Stripe payment processing service.
Handles payment intents, webhooks, and transaction verification.
"""

import logging
import stripe
from typing import Any, Optional

logger = logging.getLogger(__name__)


class StripeService:
    """Service for Stripe payment operations."""

    def __init__(self, api_key: str, webhook_secret: str):
        """
        Initialize Stripe service.

        Args:
            api_key: Stripe secret API key
            webhook_secret: Stripe webhook signing secret
        """
        stripe.api_key = api_key
        self.webhook_secret = webhook_secret

    def create_payment_intent(
        self,
        amount_cents: int,
        currency: str = "usd",
        metadata: Optional[dict[str, str]] = None,
        customer_email: Optional[str] = None,
        description: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create a Stripe payment intent.

        Args:
            amount_cents: Amount in smallest currency unit (cents for USD)
            currency: Currency code (usd, mxn, etc.)
            metadata: Optional metadata dict to attach to intent
            customer_email: Optional customer email
            description: Optional payment description

        Returns:
            Payment intent dict with: id, client_secret, status, amount, etc.

        Raises:
            stripe.error.StripeError: If payment intent creation fails
        """
        try:
            payload = {
                "amount": amount_cents,
                "currency": currency.lower(),
            }

            if metadata:
                payload["metadata"] = metadata

            if customer_email:
                payload["receipt_email"] = customer_email

            if description:
                payload["description"] = description

            intent = stripe.PaymentIntent.create(**payload)

            return {
                "id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
                "metadata": intent.metadata or {},
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating payment intent: {e}")
            raise

    def retrieve_payment_intent(self, payment_intent_id: str) -> dict[str, Any]:
        """
        Retrieve an existing payment intent.

        Args:
            payment_intent_id: Stripe payment intent ID

        Returns:
            Payment intent dict with current status and details

        Raises:
            stripe.error.InvalidRequestError: If intent not found
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            return {
                "id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
                "charges": intent.charges.data,
                "metadata": intent.metadata or {},
                "client_secret": intent.client_secret,
            }

        except stripe.error.InvalidRequestError as e:
            logger.error(f"Payment intent not found: {payment_intent_id}")
            raise
        except Exception as e:
            logger.error(f"Error retrieving payment intent: {e}")
            raise

    def handle_webhook(self, payload: bytes, sig_header: str) -> dict[str, Any]:
        """
        Verify and process Stripe webhook event.

        Args:
            payload: Raw webhook payload bytes
            sig_header: Stripe-Signature header value

        Returns:
            Parsed event dict with type and data

        Raises:
            ValueError: If signature verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )

            logger.info(f"Webhook event received: {event['type']}")

            return {
                "type": event["type"],
                "id": event.get("id"),
                "data": event.get("data", {}),
            }

        except ValueError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise ValueError("Invalid webhook signature")
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            raise

    def confirm_payment_intent(
        self, payment_intent_id: str, payment_method_id: str
    ) -> dict[str, Any]:
        """
        Confirm a payment intent with a payment method.

        Args:
            payment_intent_id: Stripe payment intent ID
            payment_method_id: Stripe payment method ID

        Returns:
            Updated payment intent dict

        Raises:
            stripe.error.StripeError: If confirmation fails
        """
        try:
            intent = stripe.PaymentIntent.confirm(
                payment_intent_id, payment_method=payment_method_id
            )

            return {
                "id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
                "charges": intent.charges.data,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Error confirming payment intent: {e}")
            raise

    def cancel_payment_intent(self, payment_intent_id: str) -> dict[str, Any]:
        """
        Cancel a payment intent.

        Args:
            payment_intent_id: Stripe payment intent ID

        Returns:
            Cancelled payment intent dict

        Raises:
            stripe.error.StripeError: If cancellation fails
        """
        try:
            intent = stripe.PaymentIntent.cancel(payment_intent_id)

            return {
                "id": intent.id,
                "status": intent.status,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Error cancelling payment intent: {e}")
            raise


# Global Stripe service instance
_stripe_service: StripeService = None


def init_stripe(api_key: str, webhook_secret: str) -> StripeService:
    """Initialize global Stripe service."""
    global _stripe_service
    _stripe_service = StripeService(api_key, webhook_secret)
    return _stripe_service


def get_stripe_service() -> StripeService:
    """Get global Stripe service instance."""
    if _stripe_service is None:
        raise RuntimeError("Stripe service not initialized")
    return _stripe_service
