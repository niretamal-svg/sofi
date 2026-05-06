# Sofi Publicación en Portales

A multi-tenant SaaS platform for managing and publishing job vacancies across multiple job portals in Latin America.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Development Setup](#manual-development-setup)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Multi-Tenancy](#multi-tenancy)
- [Portal Integrations](#portal-integrations)
- [Stripe Payment Integration](#stripe-payment-integration)
- [Google Gemini AI Integration](#google-gemini-ai-integration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

Sofi is a job publication management platform that helps HR teams and recruitment agencies publish job vacancies to multiple job portals simultaneously. The platform includes:

- **Multi-portal Publishing**: Post vacancies to OCC, Computrabajo, Indeed, Bumeran, LinkedIn, and more
- **Job Profile Templates**: Create reusable job profile templates with AI assistance
- **Campaign Management**: Organize publications into campaigns with status tracking
- **Smart Categorization**: Auto-categorize vacancies using AI (Google Gemini)
- **Payment Processing**: Built-in Stripe integration for premium portal access
- **Multi-Tenancy**: Support for multiple companies/clients with isolated data
- **Role-Based Access Control**: Admin, Reclutador (Recruiter), and Viewer roles

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser (React SPA)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│              (SPA routing + API forwarding)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         FastAPI Backend (Python 3.12)                       │
│  ├── Authentication (Firebase)                              │
│  ├── API Routes (vacancies, campaigns, profiles)            │
│  ├── Portal Integration Service                             │
│  ├── Payment Service (Stripe)                               │
│  └── AI Service (Google Gemini)                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌────────────┐  ┌────────────┐  ┌─────────────┐
    │  Firestore │  │   Stripe   │  │Google Gemini│
    │  (Cloud    │  │   (Payments)   │ (AI)        │
    │  Database) │  └────────────┘  └─────────────┘
    └────────────┘
            │
            ├── Collections: vacancies, campaigns,
            │   job_profiles, categories, portals,
            │   companies, payments, audit_logs
            │
            └── Built-in Authentication
```

## Tech Stack

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase SDK**: Authentication and real-time updates

### Backend
- **Python 3.12**: Server runtime
- **FastAPI**: Modern async web framework
- **Firestore**: NoSQL cloud database
- **Firebase Admin SDK**: Authentication and database
- **Stripe API**: Payment processing
- **Google Generative AI (Gemini)**: AI-powered features
- **Pydantic**: Data validation
- **python-dotenv**: Environment configuration

### Infrastructure
- **Docker & Docker Compose**: Containerization
- **Nginx**: Web server and reverse proxy
- **Firebase**: Backend-as-a-Service (Auth, Firestore, Cloud Functions)
- **Google Cloud Platform**: Hosting and AI services
- **Stripe**: Payment processing

## Prerequisites

### Required
- **Node.js**: v20 LTS or higher (for frontend)
- **Python**: 3.12 or higher (for backend)
- **Docker**: Latest stable version
- **Docker Compose**: v2.0+
- **Git**: Latest stable version

### External Services (sign up required)
- **Firebase Project**: Create at [firebase.google.com](https://firebase.google.com)
- **Stripe Account**: Create at [stripe.com](https://stripe.com) (development keys sufficient for testing)
- **Google Cloud Project**: For Gemini API access at [cloud.google.com](https://cloud.google.com)

### Recommended
- **VS Code**: For development
- **Postman** or **Insomnia**: For API testing
- **Firebase CLI**: For local emulation and deployment

## Quick Start

### With Docker Compose (Recommended)

1. **Clone and navigate to project**
   ```bash
   cd sofi-app
   ```

2. **Set up environment file**
   ```bash
   cp backend/.env.example .env
   ```

3. **Configure .env file with your Firebase credentials**
   ```bash
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-key-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLIC_KEY=pk_test_your_key_here

   # Gemini API
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Development Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create Python virtual environment**
   ```bash
   python3.12 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Run the backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cat > .env.local << EOF
   VITE_API_URL=http://localhost:8000
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   EOF
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Access at http://localhost:5173**

## Environment Variables

### Backend (.env)

#### Firebase Configuration
```
FIREBASE_PROJECT_ID=sofi-project
FIREBASE_PRIVATE_KEY_ID=key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@sofi-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

#### Application Configuration
```
ENVIRONMENT=development  # or production
DEBUG=true
LOG_LEVEL=INFO

# API Configuration
API_TITLE=Sofi API
API_VERSION=1.0.0
API_DESCRIPTION=Job Publication Management API

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Database
FIRESTORE_DATABASE=sofi
```

#### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_secret
```

#### AI Configuration
```
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-pro
```

#### Portal Credentials (Encryption)
```
ENCRYPTION_KEY=your-32-byte-base64-encoded-key
```

### Frontend (.env.local)

```
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=sofi-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sofi-project
VITE_FIREBASE_STORAGE_BUCKET=sofi-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Stripe Public Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Follow the setup wizard
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Select **Start in production mode** (you'll configure security rules)
4. Choose your region (e.g., `us-central1`)
5. Click **Create**

### 3. Set Up Collections

The following collections will be created automatically by the backend or setup script:

- **clients**: Client/tenant configuration
- **users**: User profiles and metadata
- **vacancies**: Job vacancy postings
- **campaigns**: Publication campaigns
- **job_profiles**: Reusable job profile templates
- **categories**: Job categories
- **portals**: Job portal configurations
- **companies**: Companies associated with client
- **payments**: Payment records
- **audit_logs**: Audit trail for compliance

### 4. Deploy Security Rules

1. Create a service account:
   - Go to **Project Settings** → **Service Accounts**
   - Click **Generate new private key**
   - Save the JSON file securely

2. Deploy firestore.rules:
   ```bash
   firebase login
   firebase deploy --only firestore:rules
   ```

3. Deploy firestore indexes (if needed):
   ```bash
   firebase deploy --only firestore:indexes
   ```

### 5. Set Up Firestore Indexes

Indexes are defined in `firestore.indexes.json`. Deploy with:

```bash
firebase deploy --only firestore:indexes
```

### 6. Initialize Client with Setup Script

Once Firebase is configured, initialize your first client:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

python scripts/setup_firebase.py \
  --client-id=mycompany \
  --admin-email=admin@mycompany.com
```

This will:
- Create client configuration
- Set up default job categories
- Configure portal connections
- Assign admin role to specified user

## Authentication

Sofi uses **Firebase Authentication** with custom claims for multi-tenancy and role-based access control.

### User Roles

- **admin**: Full access to all features, user management, settings
- **reclutador**: Create and manage vacancies, campaigns, and profiles
- **viewer**: Read-only access to dashboards and reports

### Custom Claims

Every authenticated user has custom claims set in Firebase:

```json
{
  "client_id": "mycompany",
  "role": "admin"
}
```

The backend validates these claims on every request via the `@require_auth` and `@require_role` decorators.

### Login Flow

1. User enters email and password in React app
2. Firebase SDK authenticates and returns ID token
3. Token is sent in `Authorization: Bearer {token}` header
4. Backend verifies token and extracts custom claims
5. Request is processed with user context

## Database Schema

### Vacancies Collection
```javascript
{
  client_id: string,           // Multi-tenant identifier
  titulo: string,              // Job title
  descripcion: string,         // Full job description
  categoria: string,           // Job category reference
  empresa_id: string,          // Company ID
  salario_min: number,
  salario_max: number,
  moneda: string,              // ARS, CLP, COP, MXN, PEN
  tipo_contrato: string,       // Permanent, Contract, etc.
  ubicacion: string,
  pais: string,
  estado: string,              // draft, published, closed, archived
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,           // User ID
  portales: {                  // Portal-specific data
    [portalName]: {
      publicado: boolean,
      url: string,
      fecha_publicacion: timestamp,
      estado: string,          // active, expired, closed
      datos_especificos: object // Portal-specific fields
    }
  }
}
```

### Campaigns Collection
```javascript
{
  client_id: string,
  nombre: string,              // Campaign name
  descripcion: string,
  estado: string,              // draft, scheduled, active, closed
  empresa_id: string,
  vacancia_ids: array<string>, // References to vacancies
  portales_destino: array<string>, // Target portals
  fecha_inicio: timestamp,
  fecha_fin: timestamp,
  presupuesto: number,
  presupuesto_gastado: number,
  createdAt: timestamp,
  updatedAt: timestamp,
  publication_history: subcollection
}
```

### Job Profiles Collection
```javascript
{
  client_id: string,
  nombre: string,              // Profile name
  empresa_id: string,
  descripcion: string,
  requisitos: array<string>,
  responsabilidades: array<string>,
  beneficios: array<string>,
  categoria: string,
  veces_usado: number,         // Usage count for sorting
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Portals Collection
```javascript
{
  client_id: string,
  nombre: string,              // Portal name
  url: string,
  tipo: string,                // "portal", "api", "hybrid"
  activo: boolean,
  paises: array<string>,       // Supported countries
  requiere_credenciales: boolean,
  campos_credenciales: array<string>,
  api_disponible: boolean,
  credentials: subcollection   // Encrypted user credentials
}
```

### Payments Collection
```javascript
{
  client_id: string,
  campana_id: string,
  stripe_payment_intent_id: string,
  monto: number,
  moneda: string,
  estado: string,              // pending, succeeded, failed
  descripcion: string,
  metadata: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Multi-Tenancy

Sofi is built as a multi-tenant SaaS platform where each company is a separate tenant.

### Tenant Isolation

1. **Client ID**: Every document contains a `client_id` field
2. **Security Rules**: Firestore rules ensure users can only access documents with their `client_id`
3. **Custom Claims**: User's Firebase custom claims contain their assigned `client_id`
4. **Backend Validation**: All queries automatically filtered by user's `client_id`

### Creating a New Tenant

```bash
python scripts/setup_firebase.py \
  --client-id=acme-corp \
  --admin-email=admin@acme.com
```

This creates:
- Client configuration document
- Default categories
- Portal configurations
- Admin user with custom claims

### Adding Users to a Tenant

```python
from firebase_admin import auth

# Create user
user = auth.create_user(
    email="recruiter@acme.com",
    password="secure_password"
)

# Set custom claims
auth.set_custom_user_claims(user.uid, {
    "client_id": "acme-corp",
    "role": "reclutador"
})
```

## Portal Integrations

### Supported Portals

1. **OCC** (Mexico)
   - Type: Web scraping
   - Requires: Username, Password
   - Countries: MX

2. **Computrabajo** (Latin America)
   - Type: Web scraping
   - Requires: Username, Password
   - Countries: AR, CL, CO, PE

3. **Indeed**
   - Type: API + Web
   - Requires: API Key
   - Countries: AR, CL, CO, MX, PE

4. **Bumeran** (Latin America)
   - Type: Web scraping
   - Requires: Username, Password
   - Countries: AR, CL, CO, PE

5. **LinkedIn**
   - Type: API
   - Requires: API Key
   - Countries: AR, CL, CO, MX, PE

### Adding Portal Credentials

Via API:
```bash
POST /api/portals/{portal_id}/credentials
Content-Type: application/json

{
  "username": "encrypted_username",
  "password": "encrypted_password"
}
```

Credentials are encrypted before storage using the backend's encryption service.

### Publishing to Portals

```bash
POST /api/campaigns/{campaign_id}/publish
Content-Type: application/json

{
  "portales": ["occ", "indeed", "linkedin"],
  "fecha_inicio": "2024-04-01T00:00:00Z",
  "duracion_dias": 30
}
```

## Stripe Payment Integration

### Setup

1. Create [Stripe account](https://stripe.com)
2. Get API keys from Dashboard
3. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLIC_KEY=pk_test_...
   ```

### Creating a Payment

```bash
POST /api/payments/create-intent
Content-Type: application/json

{
  "monto": 9900,  // cents
  "moneda": "usd",
  "descripcion": "Publication to 3 portals",
  "campana_id": "campaign-123"
}
```

Response:
```json
{
  "client_secret": "pi_test_secret_...",
  "payment_intent_id": "pi_test_..."
}
```

### Confirming Payment

Use the client secret with Stripe.js in the frontend to complete payment.

## Google Gemini AI Integration

### Setup

1. Create [Google Cloud project](https://cloud.google.com)
2. Enable Generative AI API
3. Create API key
4. Add to `.env`:
   ```
   GEMINI_API_KEY=your-api-key
   ```

### Using AI Features

#### Auto-Generate Job Description

```bash
POST /api/vacancies/generate-description
Content-Type: application/json

{
  "titulo": "Senior Software Engineer",
  "categoria": "Tecnología",
  "requisitos": ["Python", "FastAPI", "PostgreSQL"],
  "empresa": "Tech Company"
}
```

#### Categorize Vacancy

```bash
POST /api/vacancies/categorize
Content-Type: application/json

{
  "titulo": "Full Stack Developer",
  "descripcion": "..."
}
```

Response:
```json
{
  "categoria": "Tecnología",
  "confianza": 0.95,
  "categorias_alternativas": ["Operaciones"]
}
```

## API Documentation

### Interactive API Docs

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

#### Vacancies
- `GET /api/vacancies` - List vacancies
- `POST /api/vacancies` - Create vacancy
- `GET /api/vacancies/{id}` - Get vacancy details
- `PUT /api/vacancies/{id}` - Update vacancy
- `DELETE /api/vacancies/{id}` - Delete vacancy

#### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/{id}/publish` - Publish campaign
- `GET /api/campaigns/{id}/status` - Get publication status

#### Job Profiles
- `GET /api/profiles` - List profiles
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/{id}` - Update profile

#### Portals
- `GET /api/portals` - List available portals
- `POST /api/portals/{id}/credentials` - Set portal credentials

#### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `GET /api/payments/{id}` - Get payment status

#### AI Features
- `POST /api/ai/generate-description` - Generate job description
- `POST /api/ai/categorize` - Categorize vacancy

### Authentication

All requests require Firebase ID token:

```bash
curl -H "Authorization: Bearer $ID_TOKEN" \
     http://localhost:8000/api/vacancies
```

## Deployment

### Deploy to Google Cloud Run

1. **Build container image**
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/sofi-backend ./backend
   docker push gcr.io/YOUR_PROJECT_ID/sofi-backend
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy sofi-backend \
     --image gcr.io/YOUR_PROJECT_ID/sofi-backend \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="ENVIRONMENT=production" \
     --memory 512Mi \
     --timeout 60
   ```

3. **Deploy frontend to Firebase Hosting**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Production Checklist

- [ ] Firebase project configured for production
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Environment variables set on Cloud Run
- [ ] CORS origins configured
- [ ] Stripe production keys configured
- [ ] SSL certificates configured
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] Domain configured
- [ ] Rate limiting configured

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.12+)
- Check all environment variables are set: `grep -E '^[A-Z_]+=' .env`
- Check Firebase service account is valid
- Review logs: `docker logs sofi-backend`

### Frontend can't connect to API
- Ensure backend is running: `curl http://localhost:8000/health`
- Check API URL in frontend `.env`: `VITE_API_URL`
- Check CORS configuration in backend
- Check browser console for errors

### Firebase authentication fails
- Verify Firebase project ID matches `.env`
- Check user exists in Firebase Console → Authentication
- Verify custom claims are set: `firebase auth:get <user-id>`
- Check security rules: `firebase firestore:rules:list`

### Portal publication fails
- Verify portal credentials are correct and encrypted
- Check portal is active: `client_id` and `activo: true`
- Review backend logs for portal-specific errors
- Test manual login to portal to verify credentials

### Payment processing issues
- Verify Stripe keys are correct
- Check Stripe account is active
- Review Stripe dashboard for failed attempts
- Verify webhook endpoint is configured (for Cloud Run)

### AI features not working
- Verify Gemini API key is valid
- Check Google Cloud project has API enabled
- Review quota limits in GCP console
- Check API response in backend logs

## Support and Contributing

For issues, questions, or contributions:

1. Check existing [documentation](.)
2. Review [API documentation](http://localhost:8000/docs)
3. Check [Firebase documentation](https://firebase.google.com/docs)
4. Create an issue in the project repository

## License

Proprietary - Sofi Publicación en Portales

---

**Last Updated**: March 2024
**Version**: 1.0.0
