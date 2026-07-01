# Quick Start Guide - Sofi Backend

Get the Sofi backend running in 5 minutes.

## Prerequisites

- Python 3.12+
- pip
- Git
- Firebase account with Firestore enabled
- Google Cloud project with Gemini API enabled
- Stripe account
- A text editor or IDE

## 1. Clone and Setup (1 min)

```bash
cd sofi-app/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

## 2. Generate Encryption Key (30 seconds)

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Save the output - you'll need it for `.env`

## 3. Create .env File (2 min)

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Firebase
FIREBASE_PROJECT_ID=your-gcp-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# APIs
GEMINI_API_KEY=your-gemini-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
ENCRYPTION_KEY=your-fernet-key-from-step-2

# App Config
ENVIRONMENT=dev
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## 4. Run the Server (30 seconds)

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

## 5. Test the API (1 min)

Open http://localhost:8000/docs in your browser

You should see the Swagger UI with all available endpoints.

Click **Try it out** on any endpoint to test it!

## Common Endpoints to Try

### 1. Health Check
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-16T10:30:00",
  "version": "1.0.0"
}
```

### 2. Get Current User (requires auth)

First, get a Firebase ID token. Then:

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:8000/api/v1/auth/me
```

### 3. Create a Company

```bash
curl -X POST http://localhost:8000/api/v1/companies \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Tech Company",
    "rfc": "ABC123456",
    "pais": "Mexico",
    "logo_url": "https://example.com/logo.png"
  }'
```

### 4. List Categories

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:8000/api/v1/categories
```

### 5. Generate Job Description with AI

```bash
curl -X POST http://localhost:8000/api/v1/profiles/ai/generate \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Backend Engineer",
    "company_name": "TechCorp",
    "experience_level": "senior",
    "job_type": "tiempo_completo",
    "tone": "profesional"
  }'
```

## Getting a Firebase Token

For testing, create a user in Firebase Console and get an ID token:

```javascript
// In browser console or Node.js with firebase-admin
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'your-project' });

const uid = 'test-user-id';
const token = await admin.auth().createCustomToken(uid, {
  client_id: 'tenant-123',
  role: 'admin'
});
console.log(token);
```

## Project Structure

```
app/
├── main.py                 # FastAPI app factory
├── config.py               # Settings/configuration
├── middleware/
│   └── auth.py             # Authentication
├── models/
│   └── schemas.py          # Pydantic models
├── services/
│   ├── firestore_db.py     # Database
│   ├── encryption.py       # Secrets
│   ├── gemini.py           # AI
│   ├── stripe_service.py   # Payments
│   └── portal_publisher/   # Job portals
└── routers/
    ├── auth.py             # Auth endpoints
    ├── vacancies.py        # Job vacancies
    ├── companies.py        # Companies
    ├── categories.py       # Categories
    ├── profiles.py         # Job profiles
    ├── portals.py          # Portal config
    ├── campaigns.py        # Campaigns
    └── payments.py         # Payments
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'firebase_admin'"

```bash
pip install -r requirements.txt
```

### "FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON"

Make sure the JSON string in `.env` is:
1. Valid JSON (use a JSON validator)
2. On a single line (no newlines in the value)
3. Escaped properly if using quotes

### Playwright browser not found

```bash
playwright install chromium
```

### Port 8000 already in use

Use a different port:
```bash
python -m uvicorn app.main:app --reload --port 8001
```

### Firestore connection error

1. Check `FIREBASE_PROJECT_ID` is correct
2. Check service account JSON credentials are valid
3. Ensure Firestore is enabled in GCP project
4. Check GCP IAM permissions for service account

## Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
2. Check [README.md](README.md) for complete documentation
3. Explore endpoints in Swagger UI at http://localhost:8000/docs
4. Try creating a complete workflow:
   - Create company
   - Create category
   - Create vacancy
   - Generate AI job profile
   - Create campaign
   - (Optional) Configure portal + publish

## Key Features to Explore

### AI Job Generation
Generate professional job descriptions with:
- Gemini 1.5 Pro
- LatAm HR context
- Customizable tone
- Skill suggestions

### Portal Publishing
Automate job posting to:
- OCC
- Computrabajo
- Indeed
- Bumerán
- LinkedIn

### Multi-Tenant
Everything isolated by `client_id`:
- Companies
- Vacancies
- Campaigns
- Payments

### Firebase Auth
Token-based with custom claims:
- `client_id` for tenant isolation
- `role` for authorization (admin, reclutador, viewer)

### Stripe Payments
- Payment intents
- Webhook handling
- Campaign cost tracking

## Need Help?

- Check existing logs in terminal
- Enable DEBUG in `.env`
- Read error messages carefully
- Check Firestore documents in GCP console
- Review code comments in relevant module

## Useful Commands

```bash
# Run with debug logging
DEBUG=true python -m uvicorn app.main:app --reload

# Run on different port
python -m uvicorn app.main:app --port 8001

# Run without auto-reload
python -m uvicorn app.main:app --reload=false

# Run with specific log level
python -m uvicorn app.main:app --log-level debug

# Generate new Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Test Firestore connection
python -c "from app.services.firestore_db import get_db; db = get_db(); print('✓ Firestore connected')"
```

## Production Deployment

For production, update `.env`:

```env
ENVIRONMENT=prod
DEBUG=false
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

Then use Docker:

```bash
docker build -t sofi-backend:latest .
docker run -p 8000:8000 \
  -e FIREBASE_PROJECT_ID=your-prod-project \
  -e STRIPE_SECRET_KEY=sk_live_... \
  sofi-backend:latest
```

Or deploy to Cloud Run:

```bash
gcloud run deploy sofi-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

You're all set! Start building with Sofi. Questions? Check the full documentation in README.md.
