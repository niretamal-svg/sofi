#!/usr/bin/env python3
"""
Firebase initialization script for Sofi Publicación en Portales.

This script initializes a new client/tenant in Firestore with:
- Client configuration document
- Sample job categories
- Sample portal configurations
- User custom claims setup

Usage:
    python scripts/setup_firebase.py --client-id=mycompany --admin-email=admin@company.com
"""

import argparse
import sys
from datetime import datetime
from typing import Dict, List, Any

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, auth
except ImportError:
    print("Error: firebase-admin package not installed.")
    print("Install with: pip install firebase-admin")
    sys.exit(1)


class FirebaseSetup:
    """Handle Firebase initialization for a new client."""

    def __init__(self, client_id: str):
        """Initialize Firebase setup with client ID."""
        self.client_id = client_id
        self.db = None
        self._init_firebase()

    def _init_firebase(self):
        """Initialize Firebase connection."""
        if not firebase_admin._apps:
            try:
                # Try to use application default credentials
                credentials_obj = credentials.ApplicationDefault()
                firebase_admin.initialize_app(credentials_obj)
            except Exception as e:
                print(f"Error initializing Firebase: {e}")
                print("Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you're authenticated with gcloud.")
                sys.exit(1)

        self.db = firestore.client()

    def create_client_config(self) -> bool:
        """Create initial client configuration document."""
        try:
            client_doc = {
                "client_id": self.client_id,
                "nombre": self.client_id.replace("-", " ").title(),
                "activo": True,
                "paises": ["AR", "CL", "CO", "MX", "PE"],
                "fecha_creacion": datetime.utcnow(),
                "fecha_actualizacion": datetime.utcnow(),
                "configuracion": {
                    "max_publications_per_month": 100,
                    "stripe_account_id": "",
                    "gemini_enabled": True,
                },
            }

            self.db.collection("clients").document(self.client_id).set(client_doc)
            print(f"✓ Created client configuration for '{self.client_id}'")
            return True
        except Exception as e:
            print(f"✗ Error creating client configuration: {e}")
            return False

    def create_categories(self) -> bool:
        """Create default job categories."""
        categories: List[Dict[str, Any]] = [
            {
                "client_id": self.client_id,
                "nombre": "Tecnología",
                "descripcion": "Puestos en tecnología, desarrollo e IT",
                "activo": True,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Ventas",
                "descripcion": "Puestos comerciales y de ventas",
                "activo": True,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Marketing",
                "descripcion": "Puestos de marketing y comunicaciones",
                "activo": True,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Recursos Humanos",
                "descripcion": "Puestos en gestión de personas",
                "activo": True,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Operaciones",
                "descripcion": "Puestos operacionales y logística",
                "activo": True,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Finanzas",
                "descripcion": "Puestos en finanzas y contabilidad",
                "activo": True,
                "fecha_creacion": datetime.utcnow(),
            },
        ]

        try:
            for category in categories:
                self.db.collection("categories").add(category)

            print(f"✓ Created {len(categories)} job categories")
            return True
        except Exception as e:
            print(f"✗ Error creating categories: {e}")
            return False

    def create_portals(self) -> bool:
        """Create default portal configurations."""
        portals: List[Dict[str, Any]] = [
            {
                "client_id": self.client_id,
                "nombre": "OCC",
                "url": "https://www.occ.com.mx",
                "tipo": "portal",
                "activo": True,
                "paises": ["MX"],
                "requiere_credenciales": True,
                "campos_credenciales": ["username", "password"],
                "api_disponible": False,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Computrabajo",
                "url": "https://www.computrabajo.com",
                "tipo": "portal",
                "activo": True,
                "paises": ["AR", "CL", "CO", "PE"],
                "requiere_credenciales": True,
                "campos_credenciales": ["username", "password"],
                "api_disponible": False,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Indeed",
                "url": "https://www.indeed.com",
                "tipo": "portal",
                "activo": True,
                "paises": ["AR", "CL", "CO", "MX", "PE"],
                "requiere_credenciales": True,
                "campos_credenciales": ["api_key"],
                "api_disponible": True,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "Bumeran",
                "url": "https://www.bumeran.com",
                "tipo": "portal",
                "activo": True,
                "paises": ["AR", "CL", "CO", "PE"],
                "requiere_credenciales": True,
                "campos_credenciales": ["username", "password"],
                "api_disponible": False,
                "fecha_creacion": datetime.utcnow(),
            },
            {
                "client_id": self.client_id,
                "nombre": "LinkedIn",
                "url": "https://www.linkedin.com",
                "tipo": "portal",
                "activo": True,
                "paises": ["AR", "CL", "CO", "MX", "PE"],
                "requiere_credenciales": True,
                "campos_credenciales": ["api_key"],
                "api_disponible": True,
                "fecha_creacion": datetime.utcnow(),
            },
        ]

        try:
            for portal in portals:
                self.db.collection("portals").add(portal)

            print(f"✓ Created {len(portals)} portal configurations")
            return True
        except Exception as e:
            print(f"✗ Error creating portals: {e}")
            return False

    def set_user_custom_claims(self, email: str, role: str = "admin") -> bool:
        """Set custom claims on a Firebase user for multi-tenancy."""
        try:
            user = auth.get_user_by_email(email)
            custom_claims = {
                "client_id": self.client_id,
                "role": role,
            }
            auth.set_custom_user_claims(user.uid, custom_claims)
            print(
                f"✓ Set custom claims for user '{email}' (role: {role}, client_id: {self.client_id})"
            )
            return True
        except auth.UserNotFoundError:
            print(
                f"✗ User '{email}' not found in Firebase Authentication."
            )
            print(
                "   Create the user first using Firebase Console or Admin SDK."
            )
            return False
        except Exception as e:
            print(f"✗ Error setting custom claims: {e}")
            return False

    def run(self, admin_email: str = None) -> bool:
        """Execute full setup."""
        print(f"\nInitializing Sofi client: {self.client_id}")
        print("-" * 50)

        success = True
        success &= self.create_client_config()
        success &= self.create_categories()
        success &= self.create_portals()

        if admin_email:
            success &= self.set_user_custom_claims(admin_email, "admin")

        print("-" * 50)
        if success:
            print(f"✓ Setup completed successfully for client '{self.client_id}'")
            if admin_email:
                print(f"  Admin user: {admin_email}")
            print(
                "\nNext steps:"
            )
            print(
                "  1. Log in to Firebase Console and deploy security rules"
            )
            print(
                "  2. Deploy Firestore indexes (if needed)"
            )
            print(
                "  3. Create additional users and assign roles"
            )
            print(
                "  4. Configure portal credentials for each portal"
            )
        else:
            print(f"✗ Setup completed with errors for client '{self.client_id}'")

        return success


def main():
    """Parse arguments and run setup."""
    parser = argparse.ArgumentParser(
        description="Initialize Firebase for a new Sofi client",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup_firebase.py --client-id=mycompany
  python setup_firebase.py --client-id=acme-corp --admin-email=admin@acme.com
        """,
    )

    parser.add_argument(
        "--client-id",
        required=True,
        help="Unique client identifier (e.g., 'mycompany')",
    )
    parser.add_argument(
        "--admin-email",
        help="Email of admin user to set custom claims for",
    )

    args = parser.parse_args()

    setup = FirebaseSetup(args.client_id)
    success = setup.run(args.admin_email)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
