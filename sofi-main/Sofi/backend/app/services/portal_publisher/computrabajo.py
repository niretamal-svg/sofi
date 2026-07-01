"""
Computrabajo Mexico job portal publisher.
Automates job posting on https://www.computrabajo.com.mx
"""

import logging
from typing import Any
from playwright.async_api import Page

from .base import BasePortalPublisher, PublisherException

logger = logging.getLogger(__name__)


class ComputrabajoPublisher(BasePortalPublisher):
    """Publisher for Computrabajo.com.mx job portal."""

    async def _login(self, page: Page, username: str, password: str) -> None:
        """
        Login to Computrabajo portal.

        Args:
            page: Playwright page object
            username: Email/username
            password: Password

        Raises:
            PublisherException: If login fails
        """
        try:
            # Navigate to login page
            await page.goto(
                "https://www.computrabajo.com.mx/usuario/login",
                wait_until="networkidle",
            )

            # Fill email field
            await self._fill_input('input[type="email"], input[name="email"]', username)

            # Fill password field
            await self._fill_input('input[type="password"], input[name="password"]', password)

            # Click login button
            await self._click('button[type="submit"], button:has-text("Ingresar")')

            # Wait for navigation
            await self._wait_for_navigation()

            # Verify login
            try:
                await page.wait_for_selector(
                    'a[href*="usuario"], a[href*="perfil"], [data-testid="user-menu"]',
                    timeout=5000,
                )
                logger.info("Successfully logged into Computrabajo")
            except:
                raise PublisherException("Login verification failed")

        except PublisherException:
            raise
        except Exception as e:
            raise PublisherException(f"Computrabajo login error: {e}")

    async def _navigate_to_form(self) -> None:
        """Navigate to job posting form on Computrabajo."""
        try:
            # Navigate to post job section
            await self.page.goto(
                "https://www.computrabajo.com.mx/empresa/publicar-vacante",
                wait_until="networkidle",
            )

            # Wait for form to load
            await self._wait_for_selector("form, [data-testid='job-form']", timeout=10000)
            logger.info("Navigated to Computrabajo job posting form")

        except Exception as e:
            raise PublisherException(f"Failed to navigate to Computrabajo form: {e}")

    async def _fill_and_submit_form(self) -> dict[str, Any]:
        """
        Fill Computrabajo job form with vacancy data and submit.

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

            # Fill title
            try:
                await self._fill_input("input[placeholder*='Título'], input[name*='title']", titulo)
            except:
                logger.warning("Could not fill title on Computrabajo")

            # Fill description
            try:
                await self._fill_input(
                    "textarea[placeholder*='descripción'], textarea[name*='description']",
                    descripcion[:3000],
                )
            except:
                logger.warning("Could not fill description on Computrabajo")

            # Fill location
            try:
                await self._fill_input(
                    "input[placeholder*='ubicación'], input[name*='location'], input[placeholder*='Ubicación']",
                    ubicacion,
                )
            except:
                logger.warning("Could not fill location on Computrabajo")

            # Select category if available
            try:
                category_selectors = [
                    "select[name*='category']",
                    "select[name*='categoria']",
                    "[data-testid='category-select']",
                ]

                for selector in category_selectors:
                    try:
                        await self._select_option(selector, categoria)
                        logger.info(f"Selected category on Computrabajo: {categoria}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select category on Computrabajo")

            # Select job type if available
            try:
                type_selectors = [
                    "select[name*='tipo'], select[name*='type'], select[name*='jornada']",
                    "[data-testid='job-type-select']",
                ]

                for selector in type_selectors:
                    try:
                        await self._select_option(selector, tipo_jornada)
                        logger.info(f"Selected job type on Computrabajo: {tipo_jornada}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select job type on Computrabajo")

            # Find and click submit button
            submit_button_selectors = [
                "button[type='submit']",
                "button:has-text('Publicar')",
                "button:has-text('Enviar')",
                "button:has-text('Siguiente')",
                "[data-testid='submit-button']",
            ]

            submit_clicked = False
            for selector in submit_button_selectors:
                try:
                    await self._click(selector, timeout=5000)
                    submit_clicked = True
                    logger.info("Clicked submit on Computrabajo")
                    break
                except:
                    continue

            if not submit_clicked:
                raise PublisherException("Could not find submit button on Computrabajo")

            # Wait for success page
            await self._wait_for_navigation(timeout=15000)

            current_url = await self._get_url()
            job_id = self._extract_job_id_from_url(current_url)

            # Look for success message
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
                logger.info(f"Job successfully published on Computrabajo: {current_url}")
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
            logger.error(f"Error in Computrabajo form submission: {e}")
            raise PublisherException(f"Computrabajo submission error: {e}")

    def _extract_job_id_from_url(self, url: str) -> str:
        """Extract job ID from Computrabajo URL."""
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
                ".error-message",
                ".alert-danger",
                "[role='alert']",
                ".error",
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
