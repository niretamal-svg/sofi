"""
LinkedIn job portal publisher.
Automates job posting on https://linkedin.com via LinkedIn Talent Solutions.
"""

import logging
from typing import Any
from playwright.async_api import Page

from .base import BasePortalPublisher, PublisherException

logger = logging.getLogger(__name__)


class LinkedInPublisher(BasePortalPublisher):
    """Publisher for LinkedIn.com job posting."""

    async def _login(self, page: Page, username: str, password: str) -> None:
        """
        Login to LinkedIn.

        Args:
            page: Playwright page object
            username: Email/LinkedIn username
            password: Password

        Raises:
            PublisherException: If login fails
        """
        try:
            # Navigate to LinkedIn login
            await page.goto(
                "https://www.linkedin.com/login",
                wait_until="networkidle",
            )

            # Fill email
            await self._fill_input('input[id="username"], input[name="email"]', username)

            # Fill password
            await self._fill_input('input[id="password"], input[name="password"]', password)

            # Click login
            await self._click('button[type="submit"], button:has-text("Sign in")')

            # Wait for navigation
            await self._wait_for_navigation()

            # Check for 2FA/security verification
            try:
                # Wait for potential 2FA page
                await page.wait_for_selector("[data-testid='security-code'], input[placeholder*='code']", timeout=3000)
                logger.warning("LinkedIn 2FA required - manual intervention needed")
                raise PublisherException("Two-factor authentication required - manual login needed")
            except:
                # No 2FA detected, continue
                pass

            # Verify login
            try:
                await page.wait_for_selector(
                    'a[href*="messaging"], [data-testid="home-hashtag-feed-module"], .profile-card',
                    timeout=5000,
                )
                logger.info("Successfully logged into LinkedIn")
            except:
                raise PublisherException("Login verification failed - check credentials")

        except PublisherException:
            raise
        except Exception as e:
            raise PublisherException(f"LinkedIn login error: {e}")

    async def _navigate_to_form(self) -> None:
        """Navigate to job posting form on LinkedIn."""
        try:
            # LinkedIn uses Talent Solutions for employer posting
            # Navigate to jobs dashboard/posting area
            await self.page.goto(
                "https://www.linkedin.com/jobs/post",
                wait_until="networkidle",
            )

            # Wait for form or redirect
            await self._wait_for_selector("[data-testid='job-form'], form, [role='form']", timeout=10000)
            logger.info("Navigated to LinkedIn job posting form")

        except Exception as e:
            # LinkedIn might redirect to a different URL
            try:
                await self.page.goto(
                    "https://business.linkedin.com/talent-solutions/job-posting",
                    wait_until="networkidle",
                )
                await self._wait_for_selector("form, [role='form']", timeout=10000)
            except:
                raise PublisherException(f"Failed to navigate to LinkedIn job form: {e}")

    async def _fill_and_submit_form(self) -> dict[str, Any]:
        """
        Fill LinkedIn job form with vacancy data and submit.

        LinkedIn has a multi-step form process.

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

            # Step 1: Fill job title
            try:
                title_selectors = [
                    "input[placeholder*='Job title']",
                    "input[placeholder*='job title']",
                    "input[name*='title']",
                ]

                for selector in title_selectors:
                    try:
                        await self._fill_input(selector, titulo)
                        logger.info("Filled job title on LinkedIn")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not fill title on LinkedIn")

            # Step 2: Fill job description
            try:
                description_selectors = [
                    "textarea[placeholder*='description']",
                    "textarea[placeholder*='Description']",
                    "[contenteditable='true']",
                    "textarea",
                ]

                for selector in description_selectors:
                    try:
                        await self._fill_input(selector, descripcion[:3000])
                        logger.info("Filled job description on LinkedIn")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not fill description on LinkedIn")

            # Step 3: Fill location
            try:
                location_selectors = [
                    "input[placeholder*='Location']",
                    "input[placeholder*='location']",
                    "input[name*='location']",
                ]

                for selector in location_selectors:
                    try:
                        await self._fill_input(selector, ubicacion)
                        logger.info("Filled location on LinkedIn")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not fill location on LinkedIn")

            # Step 4: Select job level
            try:
                level_selectors = [
                    "select[name*='level']",
                    "select[name*='seniority']",
                    "[data-testid='job-level']",
                ]

                level_map = {
                    "junior": "Entry level",
                    "mid": "Mid-Level",
                    "senior": "Senior",
                    "any": "Not specified",
                }

                job_level = job_data.get("experience_level", "any")
                mapped_level = level_map.get(job_level, "Not specified")

                for selector in level_selectors:
                    try:
                        await self._select_option(selector, mapped_level)
                        logger.info(f"Selected job level on LinkedIn: {mapped_level}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select job level on LinkedIn")

            # Step 5: Select job type
            try:
                type_selectors = [
                    "select[name*='type']",
                    "select[name*='employment-type']",
                    "[data-testid='employment-type']",
                ]

                type_map = {
                    "tiempo_completo": "Full-time",
                    "tiempo_parcial": "Part-time",
                    "freelance": "Freelance",
                    "contrato": "Contract",
                }

                mapped_type = type_map.get(tipo_jornada, "Full-time")

                for selector in type_selectors:
                    try:
                        await self._select_option(selector, mapped_type)
                        logger.info(f"Selected job type on LinkedIn: {mapped_type}")
                        break
                    except:
                        continue
            except:
                logger.warning("Could not select job type on LinkedIn")

            # Step 6: Handle multi-step form navigation
            # LinkedIn often has Next buttons between form sections
            next_button_selectors = [
                "button:has-text('Next')",
                "button:has-text('Continue')",
                "[data-testid='next-button']",
            ]

            # Try to click next buttons to advance through form steps
            for _ in range(3):  # LinkedIn typically has 3-4 steps
                try:
                    for selector in next_button_selectors:
                        try:
                            await self._click(selector, timeout=3000)
                            logger.info("Clicked Next button on LinkedIn form")
                            await self._wait_for_navigation(timeout=5000)
                            break
                        except:
                            continue
                except:
                    # No more next buttons, continue to submit
                    break

            # Step 7: Submit the job posting
            submit_button_selectors = [
                "button:has-text('Post')",
                "button:has-text('Publish')",
                "button[type='submit']",
                "[data-testid='submit-button']",
                "button:has-text('Post job')",
            ]

            submit_clicked = False
            for selector in submit_button_selectors:
                try:
                    await self._click(selector, timeout=5000)
                    submit_clicked = True
                    logger.info("Clicked submit on LinkedIn")
                    break
                except:
                    continue

            if not submit_clicked:
                raise PublisherException("Could not find submit button on LinkedIn")

            # Wait for success page
            await self._wait_for_navigation(timeout=15000)

            current_url = await self._get_url()
            job_id = self._extract_job_id_from_url(current_url)

            # Check for success message
            success_indicators = [
                "has-text('posted')",
                "has-text('published')",
                "has-text('success')",
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
                # Check if we're on a job confirmation page
                is_success = "/jobs/" in current_url or "posted" in current_url.lower()

            if is_success:
                logger.info(f"Job successfully published on LinkedIn: {current_url}")
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
            logger.error(f"Error in LinkedIn form submission: {e}")
            raise PublisherException(f"LinkedIn submission error: {e}")

    def _extract_job_id_from_url(self, url: str) -> str:
        """Extract job ID from LinkedIn URL."""
        try:
            if "/jobs/view/" in url:
                return url.split("/jobs/view/")[-1].split("/")[0]
            elif "/jobs/" in url:
                return url.split("/jobs/")[-1].split("/")[0]
        except:
            pass
        return ""

    async def _extract_error_message(self) -> str:
        """Extract error message from page."""
        try:
            error_selectors = [
                "[role='alert']",
                ".artdeco-inline-feedback--error",
                ".error",
                "[class*='error']",
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
