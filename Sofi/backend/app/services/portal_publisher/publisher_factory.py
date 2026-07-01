"""
Factory for creating portal publisher instances.
Maps portal slugs to publisher classes.
"""

import logging
from typing import Optional

from .base import BasePortalPublisher, PublisherException
from .occ import OCCPublisher
from .computrabajo import ComputrabajoPublisher
from .indeed import IndeedPublisher
from .bumeran import BumeranPublisher
from .linkedin import LinkedInPublisher

logger = logging.getLogger(__name__)

# Portal slug to publisher class mapping
PORTAL_PUBLISHERS = {
    "occ": OCCPublisher,
    "computrabajo": ComputrabajoPublisher,
    "indeed": IndeedPublisher,
    "bumeran": BumeranPublisher,
    "linkedin": LinkedInPublisher,
}


def get_publisher(
    portal_slug: str,
    portal_config: dict,
    job_data: dict,
    encryption_service: Optional[object] = None,
) -> BasePortalPublisher:
    """
    Factory function to create portal publisher instance.

    Args:
        portal_slug: Portal identifier slug (e.g., 'occ', 'computrabajo')
        portal_config: Portal configuration dict with credentials
        job_data: Job vacancy data to publish
        encryption_service: Optional encryption service for decrypting credentials

    Returns:
        Appropriate BasePortalPublisher subclass instance

    Raises:
        PublisherException: If portal slug is not supported
    """
    portal_slug = portal_slug.lower().strip()

    if portal_slug not in PORTAL_PUBLISHERS:
        supported = ", ".join(PORTAL_PUBLISHERS.keys())
        raise PublisherException(
            f"Unsupported portal: {portal_slug}. Supported portals: {supported}"
        )

    publisher_class = PORTAL_PUBLISHERS[portal_slug]

    logger.info(f"Creating publisher for portal: {portal_slug}")

    return publisher_class(
        portal_config=portal_config,
        job_data=job_data,
        encryption_service=encryption_service,
    )


def get_supported_portals() -> list[str]:
    """Get list of supported portal slugs."""
    return list(PORTAL_PUBLISHERS.keys())


def is_portal_supported(portal_slug: str) -> bool:
    """Check if portal slug is supported."""
    return portal_slug.lower() in PORTAL_PUBLISHERS
