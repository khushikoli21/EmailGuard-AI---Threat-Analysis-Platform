from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api", tags=["Analytics"])

@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Compute dynamic threat analytics and telemetry distributions from database records"
)
def get_analytics_endpoint(db: Session = Depends(get_db)):
    """
    Computes all statistics dynamically from real database records:
    - Total emails and threat breakdown counts
    - Mean risk score
    - 20-point risk score buckets
    - Timeline progression
    - Frequency of flagged indicators
    """
    return analytics_service.compute_analytics(db=db)
