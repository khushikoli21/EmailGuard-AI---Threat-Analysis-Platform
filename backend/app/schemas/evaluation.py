from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EvaluationSampleInput(BaseModel):
    email_id: Optional[str] = None
    subject: str
    body: str
    ground_truth_label: str = Field(..., description="Safe, Suspicious, Phishing, Spam")

class EvaluationRunRequest(BaseModel):
    dataset_name: str = "Custom Dataset Run"
    samples: Optional[List[EvaluationSampleInput]] = None
    use_sample_dataset: bool = False

class ConfusionMatrixData(BaseModel):
    labels: List[str]
    matrix: List[List[int]]

class EvaluationResponse(BaseModel):
    datasetName: str
    totalSamples: Optional[int] = None
    classes: List[str] = ["Safe", "Suspicious", "Phishing", "Spam"]
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1Score: Optional[float] = None
    confusionMatrix: Optional[ConfusionMatrixData] = None
    status: str = "pending_evaluation"  # 'pending_evaluation', 'completed', 'failed'
    lastEvaluatedAt: Optional[str] = None
    message: str = "Evaluation results will appear here after backend evaluation."
