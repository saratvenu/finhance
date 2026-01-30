from pydantic import BaseModel
from typing import List, Optional


# ------------------------------
# Row used for /predict endpoint
# ------------------------------

class PredictRow(BaseModel):
    account_id: Optional[str] = None
    category: Optional[str] = None

    avg_1m: float
    avg_3m: float
    avg_6m: float
    std_6m: float
    count_6m: float
    seasonality_month: int

    # Additional engineered features
    growth_1m_over_3m: Optional[float] = 0.0
    ratio_1m_over_6m: Optional[float] = 0.0
    std_norm: Optional[float] = 0.0
    season_sin: Optional[float] = 0.0
    season_cos: Optional[float] = 0.0
    is_recurring_candidate: Optional[int] = 0


class PredictRequest(BaseModel):
    rows: List[PredictRow]


# ------------------------------
# Response Model
# ------------------------------

class PredictResponseRow(BaseModel):
    account_id: Optional[str]
    category: Optional[str]
    predicted_next_month: float


class PredictResponse(BaseModel):
    predictions: List[PredictResponseRow]

