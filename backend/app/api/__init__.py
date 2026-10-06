from fastapi import APIRouter
from app.api.routes_analysis import router as analysis_router
from app.api.routes_email import router as email_router
from app.api.routes_reports import router as reports_router
from app.api.routes_analytics import router as analytics_router
from app.api.routes_evidence import router as evidence_router
from app.api.routes_evaluation import router as evaluation_router
from app.api.routes_gmail import router as gmail_router

api_router = APIRouter()
api_router.include_router(analysis_router)
api_router.include_router(email_router)
api_router.include_router(reports_router)
api_router.include_router(analytics_router)
api_router.include_router(evidence_router)
api_router.include_router(evaluation_router)
api_router.include_router(gmail_router)
