import asyncio
import sys
import logging
import os

# Add parent directory to path so 'app' can be resolved
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.services.firestore_db import init_firestore, get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed():
    logger.info("Starting database seeding...")
    
    # Initialize Firestore
    init_firestore(settings.get_firebase_credentials(), settings.firebase_project_id)
    db = get_db()
    
    client_id = "test_client"

    # 1. Seed Company
    companies_ref = db.collection('companies')
    if not list(companies_ref.limit(1).stream()):
        logger.info("Seeding Companies...")
        companies_ref.document("acme-corp").set({
            "nombre": "Acme Corp",
            "rfc": "ACME123456",
            "pais": "México",
            "activa": True,
            "client_id": client_id,
            "logo_url": "https://ui-avatars.com/api/?name=Acme+Corp&background=random"
        })
    else:
        logger.info("Companies already seeded.")

    # 2. Seed Category
    categories_ref = db.collection('categories')
    if not list(categories_ref.limit(1).stream()):
        logger.info("Seeding Categories...")
        categories_ref.document("cat-tech").set({
            "nombre": "Tecnología y Sistemas",
            "slug": "tecnologia",
            "activa": True,
            "client_id": client_id,
            "orden": 1
        })
        categories_ref.document("cat-sales").set({
            "nombre": "Ventas y Comercial",
            "slug": "ventas",
            "activa": True,
            "client_id": client_id,
            "orden": 2
        })
    else:
        logger.info("Categories already seeded.")

    # 3. Seed Portals
    portals_ref = db.collection('portals')
    if not list(portals_ref.limit(1).stream()):
        logger.info("Seeding Portals...")
        
        # LinkedIn
        portals_ref.document("portal-linkedin").set({
            "nombre": "LinkedIn",
            "slug": "linkedin",
            "url": "https://linkedin.com",
            "paises": ["GLOBAL"],
            "tipo": "social_network",
            "modelo": "freemium",
            "costo_base": 0.0,
            "moneda": "USD",
            "logo_url": "https://cdn-icons-png.flaticon.com/512/174/174857.png",
            "requires_login": True,
            "activo": True,
            "client_id": client_id
        })

        # Computrabajo
        portals_ref.document("portal-computrabajo").set({
            "nombre": "Computrabajo",
            "slug": "computrabajo",
            "url": "https://computrabajo.com",
            "paises": ["MX", "GT", "HN", "SV", "NI", "US"],
            "tipo": "job_board",
            "modelo": "pago",
            "costo_base": 450.0,
            "moneda": "MXN",
            "logo_url": "https://styles.redditmedia.com/t5_2w2552/styles/communityIcon_vmyz61s4ngs61.png",
            "requires_login": True,
            "activo": True,
            "client_id": client_id
        })

        # Indeed
        portals_ref.document("portal-indeed").set({
            "nombre": "Indeed",
            "slug": "indeed",
            "url": "https://indeed.com",
            "paises": ["GLOBAL"],
            "tipo": "job_board",
            "modelo": "gratis",
            "costo_base": 0.0,
            "moneda": "USD",
            "logo_url": "https://cdn.iconscout.com/icon/free/png-256/indeed-2752158-2284975.png",
            "requires_login": True,
            "activo": True,
            "client_id": client_id
        })
    else:
        logger.info("Portals already seeded.")

    logger.info("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
