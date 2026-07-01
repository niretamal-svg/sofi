"""
Bumerán job portal publisher.
Automates job posting on https://www.bumeran.com
"""

import logging
from typing import Any
from playwright.async_api import Page

from .base import BasePortalPublisher, PublisherException

logger = logging.getLogger(__name__)


class BumeranPublisher(BasePortalPublisher):
    """Publisher for Bumeran.com job portal."""

    async def _login(self, page: Page, username: str, password: str) -> None:
        """
        Login to Bumerán portal.

        Args:
            page: Playwright page object
            username: Email/username
            password: Password

        Raises:
            PublisherException: If login fails
        """
        try:
            # Navigate to Bumerán login
            await page.goto(
                "https://www.bumeran.com/login",
                wait_until="networkidle",
            )

            # Fill email field
            await self._fill_input('input[type="email"], input[name="email"], input[id*="email"]', username)

            # Fill password field
            await self._fill_input('input[type="password"], input[name="password"]', password)

            # Click login button
            await self._click('button[type="submit"], button:has-text("Ingresar"), button:has-text("Login")')

            # Wait for navigation
            await self._wait_for_navigation()

            # Verify login by checking for user profile/dashboard
            try:
                await page.wait_for_selector(
                    'a[href*="perfil"], a[href*="dashboard"], [data-testid="user-menu"]',
                    timeout=5000,
                )
                logger.info("Successfully logged into Bumerán")
            except:
                raise PublisherException("Login verification failed")

        except PublisherException:
            raise
        except Exception as e:
            raise PublisherException(f"Bumerán login error: {e}")

    async def _navigate_to_form(self) -> None:
        """Navigate to job posting form on Bumerán."""
        try:
            # Navigate to post job section
            await self.page.goto(
                "https://www.bumeran.com/empresa/publicar",
                wait_until="networkidle",
            )

            # Wait for form
            await self._wait_for_selector("form, [data-testid='job-form']", timeout=10000)
            logger.info("Navigated to Bumerán job posting form")

        except Exception as e:
            raise PublisherException(f"Failed to navigate to Bumerán form: {e}")

    async def _fill_and_submit_form(self) -> dict[str, Any]:
        """
        Fill Bumerán job form with vacancy data and submit.

        Returns:
            Publication result dict
        """
        try:
            job_data = self.job_data
            titulo = job_data.get("nombre", "")
            descripcion = job_data.get("descripcion", "")
            ubicacion = job_data.get("direccion", "")
            categoria = job_data.get("categoria_nombre", "")
            tipo_jornada = job_data.get("tipo_jornada", "")

            # Fill job title
            try:
                await self._fill_input("input[placeholder*='Título'], input[name*='title']", titulo)
            except:
                logger.warning("Could not fill title on Bumerán")

            # Fill description
            try:
                await self._fill_input(
                    "textarea[placeholder*='descripción'], textarea[name*='description']",
                    descripcion[:2500],
                )
            except:
                logger.warning("Could not fill description on Bumerán")

            # Fill location
            try:
                await self._fill_input(
                    "input[placeholder*='ubicación'], input[name*='location'], input[placeholder*='ciudad']",
                    ubicacion,
                )
            except:
                logger.warning("Could not fill location on Bumerán")

            # Select category
            try:
                category_selectors = [
                    "select[name*='category']",
                    "select[name*='categoria']",
                    "[data-testid='category-select']",
                ]

                for selector in category_selectors:
                    try:
                        await self._select_option(selector, categoria)
                        logger.info(f"Selected category on Bumerán: {categoria}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select category on Bumerán")

            # Select job type
            try:
                type_selectors = [
                    "select[name*='tipo'], select[name*='type'], select[name*='jornada']",
                    "[data-testid='job-type']",
                ]

                for selector in type_selectors:
                    try:
                        await self._select_option(selector, tipo_jornada)
                        logger.info(f"Selected job type on Bumerán: {tipo_jornada}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select job type on Bumerán")

            # Click submit button
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
                    logger.info("Clicked submit on Bumerán")
                    break
                except:
                    continue

            if not submit_clicked:
                raise PublisherException("Could not find submit button on Bumerán")

            # Wait for success page
            await self._wait_for_navigation(timeout=15000)

            current_url = await self._get_url()
            job_id = self._extract_job_id_from_url(current_url)

            # Check for success message
            success_indicators = [
                "has-text('éxito')",
                "has-text('publicada')",
                "has-text('confirmada')",
            ]

            is_success = True
            try:
                for indicator in success_indicators:
                    try:
                        await self.page.wait_for_selector(f"*:{indicator}", timeout=3000)
                        break
                    except:
                        continue
            except:
                is_success = "publicar" not in current_url

            if is_success:
                logger.info(f"Job successfully published on Bumerán: {current_url}")
                return {
                    "success": True,
                    "url": current_url,
                    "id_externo": job_id,
                    "error_msg": None,
                }
            else:
                error_msg = await self._extract_error_message()
                raise PublisherException(f"Submission failed: {error_msg}")

        except PublisherException:
            raise
        except Exception as e:
            logger.error(f"Error in Bumerán form submission: {e}")
            raise PublisherException(f"Bumerán submission error: {e}")

    def _extract_job_id_from_url(self, url: str) -> str:
        """Extract job ID from Bumerán URL."""
        try:
            if "/oferta/" in url:
                return url.split("/oferta/")[-1].split("/")[0]
            elif "/detalle/" in url:
                return url.split("/detalle/")[-1].split("/")[0]
            elif "id=" in url:
                return url.split("id=")[-1].split("&")[0]
        except:
            pass
        return ""

    async def _extract_error_message(self) -> str:
        """Extract error message from page."""
        try:
            error_selectors = [
                ".error",
                ".error-message",
                "[role='alert']",
                ".mensaje-error",
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
