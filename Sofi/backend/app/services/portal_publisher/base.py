"""
Base class for job portal publishers.
Defines the interface and common logic for automating job postings across portals.
"""

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Optional, Tuple

from playwright.async_api import async_playwright, Page, Browser

logger = logging.getLogger(__name__)


class PublisherException(Exception):
    """Exception raised during portal publishing."""

    pass


class BasePortalPublisher(ABC):
    """Abstract base class for job portal publishers."""

    def __init__(self, portal_config: dict, job_data: dict, encryption_service=None):
        """
        Initialize portal publisher.

        Args:
            portal_config: Portal configuration including url, credentials
            job_data: Job data to publish
            encryption_service: Optional encryption service for decrypting credentials
        """
        self.portal_config = portal_config
        self.job_data = job_data
        self.encryption_service = encryption_service
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None

    async def publish(self) -> dict[str, Any]:
        """
        Publish job to portal.

        Returns:
            dict with:
                - success (bool): Whether publication was successful
                - url (str): URL of published job if successful
                - id_externo (str): Portal's job ID if available
                - error_msg (str): Error message if failed
        """
        try:
            async with async_playwright() as playwright:
                self.browser = await playwright.chromium.launch(headless=True)
                self.page = await self.browser.new_page()

                # Set user agent to appear more natural
                await self.page.set_extra_http_headers(
                    {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    }
                )

                # Login to portal
                username, password = await self._get_credentials()
                await self._login(self.page, username, password)

                # Navigate to job posting form
                await self._navigate_to_form()

                # Fill and submit the job form
                result = await self._fill_and_submit_form()

                return result

        except Exception as e:
            logger.error(f"Error publishing to {self.portal_config['nombre']}: {e}")
            return {
                "success": False,
                "url": None,
                "id_externo": None,
                "error_msg": str(e),
            }
        finally:
            if self.browser:
                await self.browser.close()

    async def _get_credentials(self) -> Tuple[str, str]:
        """
        Decrypt and return portal credentials.

        Returns:
            Tuple of (username, password)

        Raises:
            PublisherException: If credentials are missing or invalid
        """
        if not self.encryption_service:
            raise PublisherException("Encryption service not configured")

        username_encrypted = self.portal_config.get("username_encrypted")
        password_encrypted = self.portal_config.get("password_encrypted")

        if not username_encrypted or not password_encrypted:
            raise PublisherException("Portal credentials not configured")

        try:
            username = self.encryption_service.decrypt(username_encrypted)
            password = self.encryption_service.decrypt(password_encrypted)
            return username, password
        except Exception as e:
            raise PublisherException(f"Failed to decrypt credentials: {e}")

    @abstractmethod
    async def _login(self, page: Page, username: str, password: str) -> None:
        """
        Login to portal.

        Args:
            page: Playwright page object
            username: Portal username
            password: Portal password

        Raises:
            PublisherException: If login fails
        """
        pass

    async def _navigate_to_form(self) -> None:
        """
        Navigate to job posting form. Can be overridden by subclasses if needed.

        Raises:
            PublisherException: If navigation fails
        """
        pass

    @abstractmethod
    async def _fill_and_submit_form(self) -> dict[str, Any]:
        """
        Fill job form with data and submit.

        Returns:
            dict with:
                - success (bool): Whether submission was successful
                - url (str): URL of published job if successful
                - id_externo (str): Portal's job ID if available
                - error_msg (str): Error message if failed
        """
        pass

    async def _wait_for_selector(self, selector: str, timeout: int = 10000) -> None:
        """
        Wait for selector to be visible.

        Args:
            selector: CSS/XPath selector
            timeout: Timeout in milliseconds

        Raises:
            PublisherException: If selector not found within timeout
        """
        try:
            await self.page.wait_for_selector(selector, timeout=timeout)
        except Exception as e:
            raise PublisherException(f"Selector not found: {selector} ({e})")

    async def _fill_input(self, selector: str, value: str) -> None:
        """
        Fill input field.

        Args:
            selector: Input selector
            value: Value to fill

        Raises:
            PublisherException: If field not found
        """
        try:
            await self._wait_for_selector(selector)
            await self.page.fill(selector, value)
        except Exception as e:
            raise PublisherException(f"Failed to fill input {selector}: {e}")

    async def _click(self, selector: str, timeout: int = 10000) -> None:
        """
        Click element.

        Args:
            selector: Element selector
            timeout: Timeout in milliseconds

        Raises:
            PublisherException: If element not found
        """
        try:
            await self._wait_for_selector(selector, timeout)
            await self.page.click(selector)
        except Exception as e:
            raise PublisherException(f"Failed to click {selector}: {e}")

    async def _select_option(self, selector: str, value: str) -> None:
        """
        Select option from dropdown.

        Args:
            selector: Select element selector
            value: Option value to select

        Raises:
            PublisherException: If selection fails
        """
        try:
            await self._wait_for_selector(selector)
            await self.page.select_option(selector, value)
        except Exception as e:
            raise PublisherException(f"Failed to select option {selector}: {e}")

    async def _get_url(self) -> str:
        """Get current page URL."""
        return self.page.url

    async def _wait_for_navigation(self, timeout: int = 10000) -> None:
        """
        Wait for page navigation to complete.

        Args:
            timeout: Timeout in milliseconds
        """
        try:
            await self.page.wait_for_load_state("networkidle", timeout=timeout)
        except Exception as e:
            logger.warning(f"Navigation timeout: {e}")

    def _get_timestamp(self) -> str:
        """Get current timestamp for logging."""
        return datetime.now().isoformat()
