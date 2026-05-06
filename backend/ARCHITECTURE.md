# Sofi Backend Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Applications                         │
│               (Web, Mobile, Desktop Frontends)                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTPS/WebSocket
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    FastAPI Backend                               │
│                  (8000 port, Uvicorn)                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Authentication Middleware                                       │
│  └─ Firebase JWT Token Verification                              │
│  └─ Custom Claims Extraction (client_id, role)                   │
│                                                                   │
│  API Routes (v1)                                                 │
│  ├─ /auth          - User profile management                     │
│  ├─ /vacancies     - Job vacancy CRUD                            │
│  ├─ /categories    - Job category management                     │
│  ├─ /companies     - Company/organization CRUD                   │
│  ├─ /profiles      - Job profile management + AI generation      │
│  ├─ /portals       - Portal configuration (admin)                │
│  ├─ /campaigns     - Campaign management + publishing trigger    │
│  └─ /payments      - Payment intent creation + webhook           │
│                                                                   │
│  Background Tasks                                                │
│  └─ Campaign Publishing (async Playwright automation)            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │        │         │         │         │          │
         │        │         │         │         │          │
    ┌────▼─┐  ┌──▼─┐   ┌──▼──┐  ┌──▼──┐  ┌──▼──┐   ┌───▼───┐
    │ Fire │  │Fir │   │ Goo │  │Stri │  │Play │   │Crypt  │
    │base │  │sto │   │ gle │  │ pe  │  │ wri │   │ograph │
    │Auth │  │re  │   │Gemi │  │     │  │ght  │   │ y     │
    └──────┘  └─────┘   └──────┘  └──────┘  └──────┘   └───────┘
```

## Technology Stack

### Core Framework
- **FastAPI 0.111.0**: Modern async Python web framework
- **Uvicorn 0.30.1**: ASGI server for running FastAPI
- **Pydantic 2.7.4**: Data validation and serialization

### Authentication & Authorization
- **Firebase Admin SDK 6.5.0**: JWT token verification
- **Custom Claims**: For role-based access control (RBAC)

### Database
- **Google Cloud Firestore 2.16.0**: NoSQL database with real-time capabilities
- **Multi-tenant isolation**: client_id on every document

### AI & Content Generation
- **Google Generative AI 0.7.2**: Gemini 1.5 Pro for job description generation

### Payment Processing
- **Stripe 10.1.0**: Payment intents, webhooks, subscriptions

### Portal Automation
- **Playwright 1.44.0**: Browser automation for job posting
- **Chromium headless**: For automated publishing

### Security
- **Cryptography 42.0.8**: Fernet encryption for storing credentials

### Utilities
- **python-dotenv 1.0.1**: Environment variable management
- **python-multipart 0.0.9**: File upload handling
- **httpx 0.27.0**: Async HTTP client

## Data Flow Patterns

### Authentication Flow

```
Client Request
    │
    ├─ Firebase ID Token (Bearer)
    │
    ▼
Middleware: verify_firebase_token()
    │
    ├─ Decode JWT
    │ ├─ Verify signature
    │ ├─ Check expiration
    │ └─ Extract claims
    │
    ▼
Extract Custom Claims
    │
    ├─ uid (Firebase User ID)
    ├─ email
    ├─ client_id (Tenant ID)
    └─ role (admin|reclutador|viewer)
    │
    ▼
Dependency Injection (get_current_user)
    │
    └─ Request Handler receives user context
```

### Multi-Tenant Isolation

Every Firestore query follows this pattern:

```python
db.collection("collection_name")
  .where("client_id", "==", client_id)  # MANDATORY
  .where("other_field", "==", value)    # Optional additional filters
  .stream()
```

This ensures:
- Data cannot leak between tenants
- Each tenant only sees their own data
- Row-level security without complex rules

### Campaign Publishing Flow

```
Client: POST /campaigns/{id}/publish
    │
    ▼
Handler validates campaign ownership
    │
    ▼
Update campaign status to "publicando"
    │
    ▼
Queue background task
    │
    ▼
Background Task: _publish_campaign_to_portals()
    │
    ├─ For each portal in campaign:
    │  │
    │  ├─ Fetch portal config from Firestore
    │  │
    │  ├─ Create Publisher instance via factory
    │  │
    │  ├─ Get encrypted credentials
    │  │
    │  ├─ Initialize Playwright browser
    │  │
    │  ├─ Execute _login(username, password)
    │  │
    │  ├─ Execute _navigate_to_form()
    │  │
    │  ├─ Execute _fill_and_submit_form()
    │  │ └─ Fill job details (title, description, etc.)
    │  │ └─ Submit form
    │  │ └─ Extract job URL and external ID
    │  │
    │  ├─ Update portal status in campaign
    │  │ └─ Store URL, external ID, timestamp
    │  │
    │  └─ Close browser
    │
    ▼
Determine overall campaign status
    │
    ├─ All successful → "publicada"
    ├─ Some failed → "error"
    └─ Still processing → "publicando"
    │
    ▼
Update campaign in Firestore with final status
```

### AI Job Profile Generation Flow

```
Client: POST /api/v1/profiles/ai/generate
    │
    ├─ job_title: "Senior Backend Engineer"
    ├─ company_name: "TechCorp"
    ├─ experience_level: "senior"
    ├─ job_type: "tiempo_completo"
    ├─ tone: "profesional"
    └─ industry: "Technology"
    │
    ▼
GeminiService.generate_job_profile()
    │
    ├─ Build prompt with context-aware instructions
    │ └─ "Eres un experto en recursos humanos de Latinoamérica..."
    │
    ├─ Call Google Generative AI API
    │ └─ gemini-1.5-pro model
    │ └─ temperature: 0.7, top_p: 0.95
    │
    ├─ Parse JSON response
    │ └─ Extract structured fields:
    │   ├─ titulo_anuncio
    │   ├─ descripcion
    │   ├─ requisitos[]
    │   ├─ beneficios[]
    │   ├─ ia_chips[] (improvement suggestions)
    │   └─ sugerencias[]
    │
    ▼
Return AIProfileResponse
    │
    └─ Client displays and can save via:
       POST /api/v1/profiles/ai/generate-and-save
```

### Payment Processing Flow

```
Client: POST /api/v1/payments
    │
    ├─ Request body:
    │  ├─ campana_id
    │  ├─ empresa_id
    │  ├─ monto
    │  ├─ moneda
    │  └─ desglose (optional breakdown)
    │
    ▼
Create Stripe PaymentIntent
    │
    ├─ StripeService.create_payment_intent()
    ├─ Amount: convert to cents
    ├─ Metadata: attach campaign_id, empresa_id, client_id
    └─ Return client_secret for frontend
    │
    ▼
Save Payment record in Firestore
    │
    ├─ Store stripe_payment_intent_id
    ├─ Status: "pendiente"
    └─ Timestamp: created_at, updated_at
    │
    ▼
Return client_secret to frontend
    │
    └─ Frontend uses Stripe.js to complete payment
    │
    ▼
Stripe Webhook: payment_intent.succeeded
    │
    ├─ Verify webhook signature
    ├─ Extract payment_intent_id and metadata
    │
    ▼
Update Firestore
    │
    ├─ Update payment status: "completado"
    ├─ Update campaign status: "pendiente_pago"
    └─ Store pago_id in campaign
```

## Firestore Schema Design

### Index Strategy

Create composite indexes for:
```
collections:
  vacancies:
    indexes:
      - client_id, estado
      - client_id, empresa_id
      - client_id, empresa_id, estado

  campaigns:
    indexes:
      - client_id, estado
      - client_id, empresa_id
      - client_id, reclutador_id

  job_profiles:
    indexes:
      - client_id, empresa_id
      - client_id, generado_por_ia

  payments:
    indexes:
      - client_id, campana_id
      - client_id, estado
```

### Subcollection Considerations

Currently flat structure. Could use subcollections for:
- `campaigns/{id}/portal_history` - Track publishing attempts
- `companies/{id}/vacancies` - Company-scoped vacancies
- `campaigns/{id}/messages` - Real-time status updates

### Data Consistency Patterns

**Eventual Consistency**:
- Campaign status updates in background task may lag
- Client polls or uses WebSocket for real-time updates

**Strong Consistency**:
- Document-level transactions for atomic updates
- Firestore transactions for multi-document updates

## Portal Publisher Architecture

### Abstract Base Class Pattern

```python
BasePortalPublisher (Abstract)
    ├─ __init__(portal_config, job_data, encryption_service)
    ├─ publish() → async
    │   └─ Orchestrates login → navigate → fill → submit
    ├─ _get_credentials() → async
    │   └─ Decrypt username/password
    ├─ _login() → async (abstract)
    ├─ _navigate_to_form() → async
    ├─ _fill_and_submit_form() → async (abstract)
    └─ Helper methods (fill_input, click, select_option, etc.)
        └─ Playwright interactions
```

### Publisher Implementations

Each portal extends `BasePortalPublisher`:

```
OCCPublisher → OCC.com.mx specific selectors
ComputrabajoPublisher → Computrabajo.com.mx specific
IndeedPublisher → Indeed global site
BumeranPublisher → Bumeran.com LatAm
LinkedInPublisher → LinkedIn Talent Solutions
```

### Factory Pattern

```python
get_publisher(portal_slug, portal_config, job_data, encryption_service)
    │
    ├─ Validate slug against PORTAL_PUBLISHERS dict
    ├─ Instantiate appropriate class
    └─ Return configured publisher instance
```

## Security Architecture

### Authentication
- Firebase JWT tokens verified on every request
- Tokens must be valid, non-expired, properly signed
- Custom claims extracted for authorization

### Authorization (RBAC)
```
admin
  ├─ Can create/edit portals
  ├─ Can create/edit categories
  └─ Can view all tenant data

reclutador (recruiter)
  ├─ Can create/edit vacancies
  ├─ Can create/edit campaigns
  ├─ Can publish campaigns
  ├─ Can create/edit job profiles
  └─ Can view own campaigns

viewer
  └─ Read-only access
```

### Data Encryption
- Portal credentials encrypted with Fernet (symmetric)
- Encryption key stored in environment variable
- Never decrypt unless publishing (need credentials)
- Encrypted values stored in Firestore

### Multi-Tenant Isolation
- Every Firestore query filters by client_id
- Row-level security enforced in application
- Client cannot access other tenant's data
- Cross-tenant access logs suspicious activity

### API Security
- CORS configured for specific origins
- No sensitive data in error messages (prod)
- Request validation via Pydantic
- Rate limiting (can be added)
- HTTPS enforced in production

## Performance Optimization

### Database
- Firestore indexes for common queries
- Collection subcollections for better scaling
- Document read/write costs monitored

### Async Processing
- Background tasks for long operations (publishing)
- Doesn't block API response
- Client polls or uses WebSocket for updates

### Caching
- Portal list cached on client side
- Job categories cached
- Consider Redis for user sessions

### Browser Automation
- Headless Chromium for minimal resource usage
- Browser recycled between portals if possible
- Timeout handling prevents hanging
- Error recovery with retry logic

## Error Handling Strategy

### API Errors
```
ValidationError (400)
  └─ Pydantic validation failed

AuthenticationError (401)
  ├─ Missing token
  ├─ Invalid token
  ├─ Token expired
  └─ Invalid claims

AuthorizationError (403)
  └─ Insufficient role/permissions

NotFoundError (404)
  └─ Resource doesn't exist

ConflictError (409)
  └─ Duplicate resource (slug, etc.)

ServerError (500)
  └─ Unexpected error
```

### Publisher Errors
```
PublisherException
  ├─ LoginError
  │  ├─ Invalid credentials
  │  └─ Session expired
  ├─ FormError
  │  ├─ Selector not found
  │  ├─ Field validation failed
  │  └─ Submission timeout
  └─ ExtractionError
     └─ Job URL not found in response
```

## Logging Strategy

### Log Levels
- **DEBUG**: Detailed development info, function entry/exit
- **INFO**: General events (resource created, auth success)
- **WARNING**: Unexpected situations (publication retry)
- **ERROR**: Failures (auth failed, publishing failed)

### Log Aggregation (Production)
- Send logs to Cloud Logging
- Structured logging with JSON format
- Monitor for error spikes
- Alert on critical errors

## Deployment Architecture

### Docker Image
```dockerfile
FROM python:3.12-slim
  ├─ Install dependencies
  ├─ Install Playwright browsers
  └─ Run Uvicorn on 8000
```

### Container Orchestration Options
1. **Cloud Run** (recommended for serverless)
2. **GKE** (Kubernetes for complex deployments)
3. **App Engine** (traditional deployment)

### Environment Variables
- Loaded from `.env` via pydantic-settings
- Production values from secret manager
- Never hardcoded in code or images

## Scaling Strategy

### Horizontal Scaling
- Stateless API servers behind load balancer
- Multiple Uvicorn workers per container
- Container auto-scaling based on CPU/memory

### Database Scaling
- Firestore auto-scales for reads/writes
- Monitor index size and query costs
- Consider data partitioning if huge

### Background Jobs
- Use Cloud Tasks instead of in-app background tasks
- Supports retry, deduplication, scheduling
- Better for high volume publishing

## Monitoring & Observability

### Metrics to Track
- API request latency (p50, p95, p99)
- Error rate by endpoint
- Database query counts
- Firestore costs
- Portal publication success rate
- Gemini API usage

### Alerts
- Error rate > 5%
- API latency p95 > 500ms
- Database quota exceeded
- Stripe webhook failures
- Publishing failure rate > 10%

## Future Enhancements

1. **WebSocket Support**: Real-time campaign status updates
2. **Job Profile Templates**: Pre-built templates for industries
3. **Advanced Analytics**: Campaign performance tracking
4. **Bulk Operations**: Multi-campaign publishing
5. **Scheduled Publishing**: Time-based campaign publication
6. **API Rate Limiting**: Prevent abuse
7. **Audit Logging**: Track all data changes
8. **Data Export**: CSV/Excel exports of campaigns
