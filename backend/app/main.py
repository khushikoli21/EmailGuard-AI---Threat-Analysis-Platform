import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging_config import logger
from app.db.database import init_db
from app.rag.knowledge_loader import load_default_knowledge
from app.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables & RAG Vectors
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    try:
        init_db()
        logger.info("Database schemas initialized.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

    try:
        load_default_knowledge()
        logger.info("Knowledge base vector store loaded.")
    except Exception as e:
        logger.error(f"Knowledge loader error: {e}")

    yield

    # Shutdown
    logger.info("Shutting down EmailGuard AI security backend.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend service for AI-Powered Intelligent Email Threat Detection & Security Analysis Platform.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred in the security processing pipeline."}
    )

# Health Check Endpoint
@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.LLM_PROVIDER,
        "database": "connected"
    }

# Mount API Endpoints
app.include_router(api_router)
