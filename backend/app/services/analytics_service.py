from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import models
from app.schemas.analytics import (
    AnalyticsResponse,
    SummaryStats,
    DistributionItem,
    RiskScoreBucket,
    TimelineItem,
    TopIndicatorItem
)

class AnalyticsService:
    """Computes real-time telemetry analytics dynamically from database records."""

    def compute_analytics(self, db: Session) -> AnalyticsResponse:
        total_emails = db.query(models.Email).count()
        analyses = db.query(models.Analysis).all()

        safe_count = 0
        suspicious_count = 0
        phishing_count = 0
        spam_count = 0
        critical_count = 0
        score_sum = 0.0
        score_count = 0

        # Classification counts
        for a in analyses:
            cls = (a.classification or "").lower()
            if cls == "safe":
                safe_count += 1
            elif cls == "suspicious":
                suspicious_count += 1
            elif cls in ["phishing", "malicious", "business email compromise", "credential harvesting"]:
                phishing_count += 1
            elif cls == "spam":
                spam_count += 1

            if a.risk_score is not None:
                score_sum += a.risk_score
                score_count += 1
                if a.risk_score >= 80.0:
                    critical_count += 1

        avg_score = round(score_sum / score_count, 1) if score_count > 0 else 0.0

        summary = SummaryStats(
            totalAnalyzed=total_emails,
            safeCount=safe_count,
            suspiciousCount=suspicious_count,
            phishingCount=phishing_count,
            spamCount=spam_count,
            averageRiskScore=avg_score,
            criticalAlertsCount=critical_count
        )

        threat_distribution = [
            DistributionItem(name="Safe", value=safe_count, color="#10B981"),
            DistributionItem(name="Suspicious", value=suspicious_count, color="#F59E0B"),
            DistributionItem(name="Phishing", value=phishing_count, color="#EF4444"),
            DistributionItem(name="Spam", value=spam_count, color="#8B5CF6"),
        ]

        # 20-Point Risk Buckets
        b_0_20 = 0
        b_21_40 = 0
        b_41_60 = 0
        b_61_80 = 0
        b_81_100 = 0

        for a in analyses:
            if a.risk_score is not None:
                s = a.risk_score
                if s <= 20:
                    b_0_20 += 1
                elif s <= 40:
                    b_21_40 += 1
                elif s <= 60:
                    b_41_60 += 1
                elif s <= 80:
                    b_61_80 += 1
                else:
                    b_81_100 += 1

        risk_buckets = [
            RiskScoreBucket(range="0–20 (Low)", count=b_0_20, label="Safe / Low Risk"),
            RiskScoreBucket(range="21–40 (Low-Med)", count=b_21_40, label="Minor Anomalies"),
            RiskScoreBucket(range="41–60 (Medium)", count=b_41_60, label="Suspicious Elements"),
            RiskScoreBucket(range="61–80 (High)", count=b_61_80, label="Confirmed Threat Signals"),
            RiskScoreBucket(range="81–100 (Critical)", count=b_81_100, label="Active Attacks / Injections"),
        ]

        # Timeline Data: Group by Date (Past 7 days)
        date_map = defaultdict(lambda: {"safe": 0, "suspicious": 0, "phishing": 0, "spam": 0, "total": 0})
        for a in analyses:
            created = a.created_at or datetime.utcnow()
            d_str = created.strftime("%b %d")
            cls = (a.classification or "").lower()
            date_map[d_str]["total"] += 1
            if cls == "safe":
                date_map[d_str]["safe"] += 1
            elif cls == "suspicious":
                date_map[d_str]["suspicious"] += 1
            elif cls in ["phishing", "malicious", "business email compromise"]:
                date_map[d_str]["phishing"] += 1
            elif cls == "spam":
                date_map[d_str]["spam"] += 1

        timeline = []
        if date_map:
            for d_str, counts in sorted(date_map.items()):
                timeline.append(TimelineItem(date=d_str, **counts))
        else:
            # Baseline empty timeline item
            now_str = datetime.utcnow().strftime("%b %d")
            timeline.append(TimelineItem(date=now_str, safe=0, suspicious=0, phishing=0, spam=0, total=0))

        # Top Indicators Frequency
        indicator_counts = (
            db.query(models.Indicator.title, models.Indicator.severity, func.count(models.Indicator.id))
            .group_by(models.Indicator.title, models.Indicator.severity)
            .order_by(func.count(models.Indicator.id).desc())
            .limit(7)
            .all()
        )

        top_indicators = [
            TopIndicatorItem(name=row[0], severity=row[1], frequency=row[2])
            for row in indicator_counts
        ]

        return AnalyticsResponse(
            summary=summary,
            threatDistribution=threat_distribution,
            riskScoreBuckets=risk_buckets,
            volumeOverTime=timeline,
            topIndicators=top_indicators
        )

analytics_service = AnalyticsService()
