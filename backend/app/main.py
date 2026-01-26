"""FastAPI application entry point.

This module creates and configures the FastAPI application instance.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.chroma import router as chroma_router
from app.api.v1 import router as api_v1_router
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager.

    Handles startup and shutdown events.
    """
    # Startup
    settings = get_settings()
    print(f"Starting Certificate Master API in {settings.ENVIRONMENT} mode")
    yield
    # Shutdown
    print("Shutting down Certificate Master API")


settings = get_settings()

app = FastAPI(
    title="Certificate Master API",
    description="Backend API for Certificate Master - Korean certificate information platform",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
# Always use explicit origins from config to support credentials
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

logger.info(f"📋 CORS Configuration:")
logger.info(f"  - Environment: {settings.ENVIRONMENT}")
logger.info(f"  - Origins: {cors_origins}")
logger.info(f"  - Credentials: True")
logger.info(f"  - Methods: *")
logger.info(f"  - Headers: *")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for debugging."""
    logger.info("=" * 80)
    logger.info(f"🌍 Incoming Request: {request.method} {request.url.path}")
    logger.info(f"📍 Origin: {request.headers.get('origin', 'N/A')}")
    logger.info(f"🔑 Authorization: {request.headers.get('authorization', 'N/A')[:30]}...")
    logger.info(f"📦 Content-Type: {request.headers.get('content-type', 'N/A')}")
    
    response = await call_next(request)
    
    logger.info(f"📤 Response Status: {response.status_code}")
    logger.info("=" * 80)
    
    return response


# Include API router
app.include_router(api_v1_router, prefix="/api")
app.include_router(chroma_router)


@app.get("/health")
async def health_check():
    """Health check endpoint.

    Returns:
        Health status of the API service.
    """
    return {
        "status": "healthy",
        "service": "certificate-master-api",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health/db")
async def database_health_check():
    """Database health check endpoint.

    Returns:
        Database connection status (MariaDB).
    """
    from sqlalchemy import text

    from app.core.database import get_engine

    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM certificates"))
            count = result.fetchone()[0]
        return {
            "status": "healthy",
            "database": "connected",
            "has_data": count > 0,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Certificate Master API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
