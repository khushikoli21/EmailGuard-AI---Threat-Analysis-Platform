from fastapi import APIRouter, Depends, status
from app.schemas.evaluation import EvaluationResponse, EvaluationRunRequest
from app.services.evaluation_service import evaluation_service

router = APIRouter(prefix="/api", tags=["Dataset Evaluation"])

@router.get(
    "/evaluation",
    response_model=EvaluationResponse,
    summary="Get calculated dataset evaluation metrics (returns empty state if not yet run)"
)
def get_evaluation_endpoint():
    """
    Returns empirical evaluation results:
    - Accuracy, precision, recall, F1-score
    - Confusion matrix
    If no evaluation has been executed, returns pending status with null scores.
    """
    return evaluation_service.get_latest_results()

@router.post(
    "/evaluation/run",
    response_model=EvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute benchmark evaluation against a dataset"
)
async def run_evaluation_endpoint(payload: EvaluationRunRequest):
    """
    Executes the pipeline across dataset samples, calculates actual metrics,
    and returns verified performance numbers.
    """
    return await evaluation_service.run_evaluation(payload)
