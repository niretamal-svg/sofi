"""
FastAPI application factory and main entry point.
Initializes all services and configures routes.
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.database import init_mongodb, close_mongodb
from app.services.encryption import init_encryption
from app.services.gemini import init_gemini
from app.services.stripe_service import init_stripe
from app.services.transbank_service import init_transbank
from app.models.schemas import HealthResponse, ErrorResponse

# Import routers
from app.routers import auth, vacancies, categories, companies, profiles, portals, campaigns, payments

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ============================================================================
# Startup and Shutdown
# ============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown."""
    # Startup
    logger.info("Starting Sofi application...")

    try:
        # Initialize MongoDB
        init_mongodb()

        # Initialize encryption
        init_encryption(settings.encryption_key)
        logger.info("Encryption service initialized")

        # Initialize Gemini
        init_gemini(settings.gemini_api_key)
        logger.info("Gemini service initialized")

        # Initialize Stripe
        init_stripe(settings.stripe_secret_key, settings.stripe_webhook_secret)
        logger.info("Stripe service initialized")

        # Initialize Transbank
        init_transbank(settings.transbank_commerce_code, settings.transbank_api_key, settings.transbank_environment)
        logger.info("Transbank service initialized")

        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down Sofi application...")
    close_mongodb()


# ============================================================================
# FastAPI App Creation
# ============================================================================


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""

    app = FastAPI(
        title="Sofi Job Publication Platform",
        description="Multi-tenant job publication and portal automation API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ========================================================================
    # CORS Middleware
    # ========================================================================

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ========================================================================
    # Exception Handlers
    # ========================================================================

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors with formatted response."""
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "detail": exc.errors(),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected errors."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": "An unexpected error occurred",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    # ========================================================================
    # Health Check
    # ========================================================================

    @app.get("/health", response_model=HealthResponse, tags=["health"])
    async def health_check() -> HealthResponse:
        """Health check endpoint."""
        return HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            version="1.0.0",
        )

    # ========================================================================
    # API Routes
    # ========================================================================

    api_prefix = settings.api_prefix

    # Include routers with prefix
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(vacancies.router, prefix=api_prefix)
    app.include_router(categories.router, prefix=api_prefix)
    app.include_router(companies.router, prefix=api_prefix)
    app.include_router(profiles.router, prefix=api_prefix)
    app.include_router(portals.router, prefix=api_prefix)
    app.include_router(campaigns.router, prefix=api_prefix)
    app.include_router(payments.router, prefix=api_prefix)

    # ========================================================================
    # Stripe Webhook (outside of API prefix)
    # ========================================================================

    @app.post("/webhooks/stripe", tags=["webhooks"])
    async def stripe_webhook(
        request: Request,
    ):
        """Stripe webhook endpoint - calls payments router."""
        return await payments.stripe_webhook(request)

    # ========================================================================
    # Root endpoint
    # ========================================================================

    @app.get("/", tags=["root"])
    async def root():
        """Root endpoint with API information."""
        return {
            "name": "Sofi Job Publication Platform API",
            "version": "1.0.0",
            "docs": "/docs",
            "api_prefix": api_prefix,
            "status": "running",
        }

    logger.info("FastAPI application configured and ready")

    return app


# Create application instance
app = create_app()


# ============================================================================
# Run Application (for development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
