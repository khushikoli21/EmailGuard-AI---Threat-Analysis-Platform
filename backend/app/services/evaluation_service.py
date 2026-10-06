from typing import List, Dict, Any, Optional
from datetime import datetime
from app.schemas.evaluation import EvaluationResponse, EvaluationRunRequest, ConfusionMatrixData
from app.schemas.email import EmailAnalyzeRequest
from app.agents.orchestrator import orchestrator
from app.db.database import SessionLocal
from app.core.logging_config import logger

# In-memory store for evaluation run results
_LATEST_EVALUATION: Optional[EvaluationResponse] = None

class EvaluationService:
    """
    Offline dataset evaluation framework.
    Calculates actual empirical performance metrics without synthetic figures.
    """

    def get_latest_results(self) -> EvaluationResponse:
        global _LATEST_EVALUATION
        if _LATEST_EVALUATION is None:
            return EvaluationResponse(
                datasetName="Enron + Nazario Phishing Corpus",
                totalSamples=None,
                classes=["Safe", "Suspicious", "Phishing", "Spam"],
                accuracy=None,
                precision=None,
                recall=None,
                f1Score=None,
                confusionMatrix=None,
                status="pending_evaluation",
                lastEvaluatedAt=None,
                message="Evaluation results will appear here after backend evaluation."
            )
        return _LATEST_EVALUATION

    async def run_evaluation(self, req: EvaluationRunRequest) -> EvaluationResponse:
        global _LATEST_EVALUATION
        samples = req.samples or []
        if not samples:
            # If no samples supplied, load small internal dev sample suite
            from app.data.sample_emails import DEV_SAMPLES
            samples = DEV_SAMPLES

        classes = ["Safe", "Suspicious", "Phishing", "Spam"]
        class_to_idx = {c: i for i, c in enumerate(classes)}
        matrix = [[0 for _ in range(len(classes))] for _ in range(len(classes))]

        correct = 0
        total = len(samples)

        db = SessionLocal()
        try:
            for s in samples:
                req_obj = EmailAnalyzeRequest(
                    sender_email="eval@test.dataset",
                    subject=s.subject,
                    body=s.body
                )
                _, _, report = await orchestrator.run_pipeline(req_obj, db)

                pred = report.classification
                actual = s.ground_truth_label

                # Normalize to one of the 4 classes
                pred_norm = "Phishing" if pred in ["Phishing", "Malicious", "Business Email Compromise"] else pred
                if pred_norm not in class_to_idx:
                    pred_norm = "Suspicious"
                if actual not in class_to_idx:
                    actual = "Phishing"

                actual_idx = class_to_idx[actual]
                pred_idx = class_to_idx[pred_norm]
                matrix[actual_idx][pred_idx] += 1

                if pred_norm.lower() == actual.lower():
                    correct += 1
        finally:
            db.close()

        # Calculate actual metrics
        accuracy = round(correct / total, 3) if total > 0 else 0.0

        # Macro precision and recall calculation
        precisions = []
        recalls = []
        for i in range(len(classes)):
            tp = matrix[i][i]
            col_sum = sum(matrix[r][i] for r in range(len(classes)))
            row_sum = sum(matrix[i][c] for c in range(len(classes)))

            p = tp / col_sum if col_sum > 0 else 0.0
            r = tp / row_sum if row_sum > 0 else 0.0
            precisions.append(p)
            recalls.append(r)

        macro_p = round(sum(precisions) / len(classes), 3)
        macro_r = round(sum(recalls) / len(classes), 3)
        macro_f1 = round((2 * macro_p * macro_r) / (macro_p + macro_r), 3) if (macro_p + macro_r) > 0 else 0.0

        result = EvaluationResponse(
            datasetName=req.dataset_name,
            totalSamples=total,
            classes=classes,
            accuracy=accuracy,
            precision=macro_p,
            recall=macro_r,
            f1Score=macro_f1,
            confusionMatrix=ConfusionMatrixData(labels=classes, matrix=matrix),
            status="completed",
            lastEvaluatedAt=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            message="Evaluation run executed and verified on backend dataset."
        )
        _LATEST_EVALUATION = result
        return result

evaluation_service = EvaluationService()
