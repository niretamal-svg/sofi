"""
OCC (Ofertas de Empleo) Mexico job portal publisher.
Automates job posting on https://www.occ.com.mx
"""

import logging
from typing import Any
from playwright.async_api import Page

from .base import BasePortalPublisher, PublisherException

logger = logging.getLogger(__name__)


class OCCPublisher(BasePortalPublisher):
    """Publisher for OCC.com.mx job portal."""

    async def _login(self, page: Page, username: str, password: str) -> None:
        """
        Login to OCC portal.

        Args:
            page: Playwright page object
            username: Email/username
            password: Password

        Raises:
            PublisherException: If login fails
        """
        try:
            # Navigate to login page
            await page.goto("https://www.occ.com.mx/candidato/login", wait_until="networkidle")

            # Find and fill email field
            await self._fill_input('input[type="email"]', username)

            # Find and fill password field
            await self._fill_input('input[type="password"]', password)

            # Click login button
            await self._click('button[type="submit"]')

            # Wait for navigation to complete
            await self._wait_for_navigation()

            # Verify we're logged in by looking for profile link or dashboard
            try:
                await page.wait_for_selector("a[href*='perfil'], a[href*='dashboard']", timeout=5000)
                logger.info("Successfully logged into OCC")
            except:
                raise PublisherException("Login verification failed - check credentials")

        except PublisherException:
            raise
        except Exception as e:
            raise PublisherException(f"OCC login error: {e}")

    async def _navigate_to_form(self) -> None:
        """Navigate to job posting form on OCC."""
        try:
            # For employers/recruiters, navigate to post job section
            await self.page.goto(
                "https://www.occ.com.mx/empresa/publicar-vacante",
                wait_until="networkidle",
            )
            await self._wait_for_selector("form, [data-testid='job-form']", timeout=10000)
            logger.info("Navigated to OCC job posting form")
        except Exception as e:
            raise PublisherException(f"Failed to navigate to OCC form: {e}")

    async def _fill_and_submit_form(self) -> dict[str, Any]:
        """
        Fill OCC job form with vacancy data and submit.

        Returns:
            Publication result dict
        """
        try:
            # Get job data
            job_data = self.job_data
            titulo = job_data.get("nombre", "")
            descripcion = job_data.get("descripcion", "")
            ubicacion = job_data.get("direccion", "")
            categoria = job_data.get("categoria_nombre", "")

            # Fill title
            try:
                await self._fill_input("input[placeholder*='Título'], input[name*='title']", titulo)
            except:
                logger.warning("Could not fill title field on OCC")

            # Fill description
            try:
                await self._fill_input(
                    "textarea[placeholder*='descripción'], textarea[name*='description']",
                    descripcion[:2000],  # OCC may have limits
                )
            except:
                logger.warning("Could not fill description field on OCC")

            # Fill location
            try:
                await self._fill_input(
                    "input[placeholder*='ubicación'], input[name*='location']",
                    ubicacion,
                )
            except:
                logger.warning("Could not fill location field on OCC")

            # Try to select category if dropdown exists
            try:
                category_selectors = [
                    "select[name*='category']",
                    "select[name*='categoria']",
                    "[data-testid='category-select']",
                ]

                for selector in category_selectors:
                    try:
                        await self._select_option(selector, categoria)
                        logger.info(f"Selected category: {categoria}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select category on OCC")

            # Find and click submit button
            submit_button_selectors = [
                "button[type='submit']",
                "button:has-text('Publicar')",
                "button:has-text('Enviar')",
                "[data-testid='submit-button']",
            ]

            submit_clicked = False
            for selector in submit_button_selectors:
                try:
                    await self._click(selector, timeout=5000)
                    submit_clicked = True
                    logger.info("Clicked submit button on OCC")
                    break
                except:
                    continue

            if not submit_clicked:
                raise PublisherException("Could not find submit button on OCC form")

            # Wait for successful submission
            await self._wait_for_navigation(timeout=15000)

            # Try to extract job ID/URL from success page
            current_url = await self._get_url()

            # Look for job ID in URL or page content
            job_id = self._extract_job_id_from_url(current_url)

            # Check for success messages
            success_indicators = [
                "has-text('éxito')",
                "has-text('publicada')",
                "has-text('confirmada')",
            ]

            is_success = True
            try:
                for indicator in success_indicators:
                    try:
                        await self.page.wait_for_selector(f"*:has-text('{indicator}')", timeout=3000)
                        break
                    except:
                        continue
            except:
                # Even if we don't see success message, URL change might indicate success
                is_success = current_url != "https://www.occ.com.mx/empresa/publicar-vacante"

            if is_success:
                logger.info(f"Job successfully published on OCC: {current_url}")
                return {
                    "success": True,
                    "url": current_url,
                    "id_externo": job_id,
                    "error_msg": None,
                }
            else:
                # Check for error messages
                error_msg = await self._extract_error_message()
                raise PublisherException(f"Submission failed: {error_msg}")

        except PublisherException:
            raise
        except Exception as e:
            logger.error(f"Error in OCC form submission: {e}")
            raise PublisherException(f"OCC form submission error: {e}")

    def _extract_job_id_from_url(self, url: str) -> str:
        """Extract job ID from OCC URL."""
        try:
            # OCC URLs typically contain job ID
            if "/oferta/" in url:
                return url.split("/oferta/")[-1].split("/")[0]
            elif "id=" in url:
                return url.split("id=")[-1].split("&")[0]
        except:
            pass
        return ""

    async def _extract_error_message(self) -> str:
        """Extract error message from page if present."""
        try:
            error_selectors = [
                ".error-message",
                ".alert-danger",
                "[role='alert']",
                ".error",
            ]

            for selector in error_selectors:
                try:
                    error_text = await self.page.text_content(selector)
                    if error_text:
                        return error_text.strip()
                except:
                    continue
        except:
            pass

        return "Unknown error"
