# Sofi Job Publication Platform - Backend API

A production-ready FastAPI backend for a multi-tenant job publication platform with automated portal publishing, AI-powered job descriptions, and integrated payment processing.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation using `client_id` field on every document
- **Firebase Authentication**: Secure token-based authentication with role-based access control
- **Firestore Database**: Scalable NoSQL database for all tenant data
- **AI Job Descriptions**: Generate professional job postings using Google Gemini 1.5 Pro
- **Automated Portal Publishing**: Browser automation via Playwright to publish jobs across multiple portals
- **Stripe Integration**: Complete payment processing with webhook handling
- **Encrypted Credentials**: Fernet encryption for storing portal login credentials
- **RESTful API**: Comprehensive API with proper error handling and validation

## Architecture

### Services

- **Firestore**: Primary data store with multi-tenant isolation
- **Firebase Auth**: Token-based authentication and authorization
- **Google Gemini**: AI service for job profile generation
- **Stripe**: Payment processing and subscription management
- **Playwright**: Browser automation for portal publishing

### Supported Job Portals

- OCC (Ofertas de Empleo) - Mexico
- Computrabajo - Mexico
- Indeed - Global
- Bumerán - LatAm
- LinkedIn - Global

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application factory
│   ├── config.py               # Configuration management
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py             # Firebase token verification
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models for validation
│   ├── services/
│   │   ├── __init__.py
│   │   ├── firestore_db.py     # Firestore initialization and helpers
│   │   ├── encryption.py       # Fernet encryption service
│   │   ├── gemini.py           # Google Gemini AI service
│   │   ├── stripe_service.py   # Stripe payment service
│   │   └── portal_publisher/
│   │       ├── __init__.py
│   │       ├── base.py         # Abstract base class for publishers
│   │       ├── occ.py          # OCC portal publisher
│   │       ├── computrabajo.py # Computrabajo publisher
│   │       ├── indeed.py       # Indeed publisher
│   │       ├── bumeran.py      # Bumerán publisher
│   │       ├── linkedin.py     # LinkedIn publisher
│   │       └── publisher_factory.py  # Publisher factory
│   └── routers/
│       ├── __init__.py
│       ├── auth.py             # Authentication endpoints
│       ├── vacancies.py        # Job vacancy management
│       ├── categories.py       # Job category management
│       ├── companies.py        # Company management
│       ├── profiles.py         # Job profile and AI generation
│       ├── portals.py          # Portal configuration
│       ├── campaigns.py        # Campaign management and publishing
│       └── payments.py         # Payment processing
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

## Database Schema

### Collections

#### `clients`
- Tenant registry
- Fields: nombre, plan_tier, activo, createdAt
- Doc ID: client_id

#### `companies`
- Fields: client_id, nombre, rfc, pais, logo_url, activa

#### `categories`
- Fields: client_id, nombre, slug, activa, icono, orden

#### `users`
- Fields: client_id, nombre, email, uid (Firebase UID), rol, empresa_id, activo

#### `vacancies`
- Fields: client_id, empresa_id, codigo, nombre, categoria_id, estado, descripcion, proposito, reclutador_id, direccion, preguntas, vigente, creado_por

#### `job_profiles`
- Fields: client_id, empresa_id, nombre_perfil, titulo_anuncio, categoria_id, tipo_jornada, salario_min, salario_max, moneda, ubicacion, descripcion, requisitos, beneficios, generado_por_ia, ia_chips, tono, veces_usado, ultimo_uso

#### `portals`
- Fields: client_id, nombre, slug, url, paises, tipo, modelo_empresa, costo_base, moneda, activo, logo_url, requires_login, username_encrypted, password_encrypted, notas

#### `campaigns`
- Fields: client_id, vacante_id, perfil_id, empresa_id, reclutador_id, paises_activos, portales (array), estado, costo_total, moneda, fecha_inicio, fecha_expiracion, pago_id

#### `payments`
- Fields: client_id, campana_id, empresa_id, monto, moneda, metodo, estado, stripe_payment_intent_id, desglose

## Setup and Installation

### Prerequisites

- Python 3.12+
- Firebase project with Firestore
- Google Cloud account with Gemini API enabled
- Stripe account
- Docker (for containerized deployment)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd sofi-app/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Generate encryption key**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

5. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

6. **Install Playwright browsers** (for portal automation)
```bash
playwright install chromium
```

### Environment Variables

See `.env.example` for all required variables:

- `FIREBASE_PROJECT_ID`: Your GCP project ID
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Service account JSON credentials
- `GEMINI_API_KEY`: Google Gemini API key
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `ENCRYPTION_KEY`: Fernet encryption key for credentials
- `ENVIRONMENT`: dev or prod
- `CORS_ORIGINS`: Comma-separated list of allowed origins

## Running the Application

### Development

```bash
# Using Python
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Using CLI directly
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

- API Documentation: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

### Docker

```bash
# Build image
docker build -t sofi-backend:latest .

# Run container
docker run -p 8000:8000 \
  -e FIREBASE_PROJECT_ID=your-project \
  -e FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' \
  -e GEMINI_API_KEY=your-key \
  -e STRIPE_SECRET_KEY=your-key \
  -e STRIPE_WEBHOOK_SECRET=your-secret \
  -e ENCRYPTION_KEY=your-key \
  sofi-backend:latest
```

## API Endpoints

### Authentication
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/me` - Update user profile

### Vacancies
- `GET /api/v1/vacancies` - List vacancies (with filters)
- `POST /api/v1/vacancies` - Create vacancy
- `GET /api/v1/vacancies/{id}` - Get vacancy
- `PUT /api/v1/vacancies/{id}` - Update vacancy

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category

### Companies
- `GET /api/v1/companies` - List companies
- `POST /api/v1/companies` - Create company
- `GET /api/v1/companies/{id}` - Get company
- `PUT /api/v1/companies/{id}` - Update company

### Job Profiles
- `GET /api/v1/profiles` - List profiles
- `POST /api/v1/profiles` - Create profile
- `GET /api/v1/profiles/{id}` - Get profile
- `POST /api/v1/profiles/ai/generate` - Generate with AI (no save)
- `POST /api/v1/profiles/ai/generate-and-save` - Generate and save with AI

### Portals
- `GET /api/v1/portals` - List portals
- `POST /api/v1/portals` - Create portal (admin only)
- `PUT /api/v1/portals/{id}` - Update portal (admin only)
- `PUT /api/v1/portals/{id}/credentials` - Update encrypted credentials

### Campaigns
- `GET /api/v1/campaigns` - List campaigns
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns/{id}` - Get campaign
- `POST /api/v1/campaigns/{id}/publish` - Publish to portals (async)
- `PATCH /api/v1/campaigns/{id}` - Update campaign

### Payments
- `POST /api/v1/payments` - Create payment intent
- `GET /api/v1/payments/{id}` - Get payment
- `POST /webhooks/stripe` - Stripe webhook handler

### Health
- `GET /health` - Health check
- `GET /` - API information

## Authentication

All endpoints (except health and root) require Firebase JWT authentication via Bearer token:

```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
  http://localhost:8000/api/v1/auth/me
```

The token must include custom claims:
- `client_id`: Tenant ID for multi-tenant isolation
- `role`: User role (admin|reclutador|viewer)

### Setting Custom Claims

In your Firebase authentication setup:

```python
from firebase_admin import auth

# After user creation in Firebase
custom_claims = {
    "client_id": "tenant123",
    "role": "reclutador"
}
auth.set_custom_user_claims(uid, custom_claims)
```

## Portal Publishing

### How It Works

1. **Campaign Created**: User creates campaign with selected portals
2. **Payment**: User makes payment via Stripe (optional)
3. **Publishing Triggered**: POST to `/api/v1/campaigns/{id}/publish`
4. **Async Publishing**: Background task publishes to each portal via Playwright
5. **Status Updates**: Campaign portals array updated with results

### Adding a New Portal

1. Create new publisher class in `app/services/portal_publisher/{portal}.py`
2. Extend `BasePortalPublisher`
3. Implement `_login()`, `_navigate_to_form()`, `_fill_and_submit_form()`
4. Register in `publisher_factory.py`

Example:

```python
from app.services.portal_publisher.base import BasePortalPublisher

class MyPortalPublisher(BasePortalPublisher):
    async def _login(self, page, username, password):
        # Login implementation
        pass

    async def _fill_and_submit_form(self):
        # Form filling implementation
        return {
            "success": True,
            "url": "...",
            "id_externo": "...",
            "error_msg": None
        }
```

Then add to `publisher_factory.py`:
```python
from .my_portal import MyPortalPublisher

PORTAL_PUBLISHERS = {
    "my_portal": MyPortalPublisher,
    # ...
}
```

## AI Job Profile Generation

Uses Google Gemini 1.5 Pro to generate professional job descriptions:

```bash
curl -X POST http://localhost:8000/api/v1/profiles/ai/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Developer",
    "company_name": "Tech Company",
    "experience_level": "senior",
    "job_type": "tiempo_completo",
    "tone": "profesional",
    "industry": "Technology"
  }'
```

Response includes:
- Generated job title and description
- Required skills list
- Benefits list
- AI improvement suggestions
- Tonal recommendations

## Error Handling

API returns proper HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "error": "Error type",
  "detail": "Detailed error message",
  "timestamp": "2024-03-16T10:30:00"
}
```

## Logging

Application logs to console with structured formatting. In production, configure your logging infrastructure to capture logs.

Log levels:
- `DEBUG`: Detailed development information
- `INFO`: General application events
- `WARNING`: Warning messages for potential issues
- `ERROR`: Error messages for failures

## Security Considerations

1. **Multi-Tenant Isolation**: Every Firestore query filters by `client_id`
2. **Authentication**: All endpoints require valid Firebase JWT
3. **Authorization**: Role-based access control via custom claims
4. **Encryption**: Portal credentials encrypted with Fernet before storage
5. **CORS**: Configured to only allow specified origins
6. **Webhook Verification**: Stripe webhooks verified with signature
7. **Error Messages**: Generic error messages in production to avoid information leakage

## Performance

- **Firestore Indexing**: Create composite indexes for common filter combinations
- **Caching**: Implement caching for frequently accessed portals list
- **Async Background Tasks**: Long-running operations (portal publishing) run asynchronously
- **Rate Limiting**: Consider implementing rate limiting in production

## Testing

```bash
# Run with pytest (create tests/ directory with test files)
pytest tests/

# Run with coverage
pytest --cov=app tests/
```

## Deployment

### Production Checklist

- [ ] Set `ENVIRONMENT=prod`
- [ ] Use production Firebase project
- [ ] Set `DEBUG=false`
- [ ] Configure proper CORS origins
- [ ] Use Stripe production keys
- [ ] Set strong encryption key
- [ ] Configure logging aggregation
- [ ] Set up monitoring and alerting
- [ ] Enable HTTPS
- [ ] Configure database backups
- [ ] Set up CI/CD pipeline
- [ ] Load test the application
- [ ] Configure resource limits in container

### Scaling

- Use Cloud Run or Kubernetes for auto-scaling
- Implement Firestore scaling policies
- Consider Memorystore (Redis) for caching
- Use Cloud Tasks for background jobs
- Monitor costs with Cloud Cost Management

## Troubleshooting

### Firestore Authentication Issues

```
google.auth.exceptions.DefaultCredentialsError: Could not automatically determine credentials
```

Solution: Set `GOOGLE_APPLICATION_CREDENTIALS` or ensure proper Firebase initialization

### Playwright Installation Issues

```bash
# On Linux, install system dependencies
apt-get install -y libpq5 libssl3 ca-certificates

# Then reinstall playwright
pip install --force-reinstall playwright
playwright install chromium
```

### Portal Publishing Failures

Check logs for:
- Authentication failures (wrong credentials)
- Form selector changes (sites update HTML)
- Rate limiting from portals
- Network connectivity issues

## Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes following code style
3. Add tests for new functionality
4. Create pull request with description

## License

[Your License Here]

## Support

For issues and questions:
- Check existing issues
- Create detailed bug report with logs
- Include Firestore document structure if database-related
- Include portal HTML structure if publishing-related
