#!/usr/bin/env python3
"""
EmailGuard AI Backend Runner Script
Execute directly with: python run.py
Or via Uvicorn: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import sys
import uvicorn
from app.core.config import settings

def main():
    print("=" * 70)
    print("  EmailGuard AI — Email Threat Detection & Security Platform Backend")
    print(f"  Target Host: http://{settings.APP_HOST}:{settings.APP_PORT}")
    print(f"  Swagger Docs: http://localhost:{settings.APP_PORT}/docs")
    print(f"  Database: {settings.DATABASE_URL}")
    print(f"  LLM Provider: {settings.LLM_PROVIDER}")
    print("=" * 70)

    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

if __name__ == "__main__":
    main()
