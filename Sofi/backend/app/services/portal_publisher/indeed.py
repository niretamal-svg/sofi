"""
Indeed job portal publisher.
Automates job posting on https://employers.indeed.com
"""

import logging
from typing import Any
from playwright.async_api import Page

from .base import BasePortalPublisher, PublisherException

logger = logging.getLogger(__name__)


class IndeedPublisher(BasePortalPublisher):
    """Publisher for Indeed.com job portal."""

    async def _login(self, page: Page, username: str, password: str) -> None:
        """
        Login to Indeed employer portal.

        Args:
            page: Playwright page object
            username: Email/username
            password: Password

        Raises:
            PublisherException: If login fails
        """
        try:
            # Navigate to Indeed employers login
            await page.goto(
                "https://employers.indeed.com/login",
                wait_until="networkidle",
            )

            # Fill email
            await self._fill_input('input[type="email"], input[id*="email"]', username)

            # Click next or find password field
            try:
                await self._click('button:has-text("Next"), button[type="submit"]', timeout=5000)
                await self._wait_for_navigation(timeout=5000)
            except:
                logger.debug("Next button not found, trying direct password entry")

            # Fill password
            await self._fill_input('input[type="password"], input[id*="password"]', password)

            # Click login
            await self._click('button:has-text("Sign in"), button[type="submit"]')

            # Wait for dashboard
            await self._wait_for_navigation()

            # Verify login
            try:
                await page.wait_for_selector(
                    'a[href*="dashboard"], [data-testid="user-menu"], a[href*="jobs"]',
                    timeout=5000,
                )
                logger.info("Successfully logged into Indeed")
            except:
                raise PublisherException("Login verification failed - check credentials")

        except PublisherException:
            raise
        except Exception as e:
            raise PublisherException(f"Indeed login error: {e}")

    async def _navigate_to_form(self) -> None:
        """Navigate to job posting form on Indeed."""
        try:
            # Navigate to post job section
            await self.page.goto(
                "https://employers.indeed.com/post-job",
                wait_until="networkidle",
            )

            # Wait for form to appear
            await self._wait_for_selector("form, [data-testid='job-form'], [role='form']", timeout=10000)
            logger.info("Navigated to Indeed job posting form")

        except Exception as e:
            raise PublisherException(f"Failed to navigate to Indeed form: {e}")

    async def _fill_and_submit_form(self) -> dict[str, Any]:
        """
        Fill Indeed job form with vacancy data and submit.

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
                await self._fill_input(
                    "input[placeholder*='job title'], input[name*='title'], input[id*='title']",
                    titulo,
                )
            except:
                logger.warning("Could not fill title on Indeed")

            # Fill job description
            try:
                # Indeed might use a rich text editor
                description_selectors = [
                    "textarea[name*='description']",
                    "[contenteditable='true']",
                    "textarea",
                ]

                for selector in description_selectors:
                    try:
                        await self._fill_input(selector, descripcion[:5000])
                        break
                    except:
                        continue
            except:
                logger.warning("Could not fill description on Indeed")

            # Fill location
            try:
                await self._fill_input(
                    "input[placeholder*='location'], input[name*='location'], input[placeholder*='city']",
                    ubicacion,
                )
            except:
                logger.warning("Could not fill location on Indeed")

            # Select job category if available
            try:
                category_selectors = [
                    "select[name*='category']",
                    "select[name*='jobCategory']",
                    "[data-testid='category-select']",
                ]

                for selector in category_selectors:
                    try:
                        await self._select_option(selector, categoria)
                        logger.info(f"Selected category on Indeed: {categoria}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select category on Indeed")

            # Select job type
            try:
                type_selectors = [
                    "select[name*='type']",
                    "select[name*='jobType']",
                    "[data-testid='job-type']",
                ]

                for selector in type_selectors:
                    try:
                        await self._select_option(selector, tipo_jornada)
                        logger.info(f"Selected job type on Indeed: {tipo_jornada}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select job type on Indeed")

            # Click post/publish button
            submit_button_selectors = [
                "button:has-text('Post job')",
                "button:has-text('Publish')",
                "button[type='submit']",
                "[data-testid='submit-button']",
            ]

            submit_clicked = False
            for selector in submit_button_selectors:
                try:
                    await self._click(selector, timeout=5000)
                    submit_clicked = True
                    logger.info("Clicked submit on Indeed")
                    break
                except:
                    continue

            if not submit_clicked:
                raise PublisherException("Could not find submit button on Indeed")

            # Wait for confirmation
            await self._wait_for_navigation(timeout=15000)

            current_url = await self._get_url()
            job_id = self._extract_job_id_from_url(current_url)

            # Check for success message
            success_indicators = [
                "has-text('published')",
                "has-text('posted')",
                "has-text('successfully')",
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
                is_success = "post-job" not in current_url and len(current_url) > 30

            if is_success:
                logger.info(f"Job successfully published on Indeed: {current_url}")
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
            logger.error(f"Error in Indeed form submission: {e}")
            raise PublisherException(f"Indeed submission error: {e}")

    def _extract_job_id_from_url(self, url: str) -> str:
        """Extract job ID from Indeed URL."""
        try:
            if "/viewjob?jk=" in url:
                return url.split("/viewjob?jk=")[-1].split("&")[0]
            elif "jk=" in url:
                return url.split("jk=")[-1].split("&")[0]
            elif "/jobs/" in url:
                return url.split("/jobs/")[-1].split("?")[0]
        except:
            pass
        return ""

    async def _extract_error_message(self) -> str:
        """Extract error message from page."""
        try:
            error_selectors = [
                "[role='alert']",
                ".error",
                ".error-message",
                ".notification--error",
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
