from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class FinalInput(BaseModel):
    emotion_score: float  # 0.0 ~ 1.0
    gaze_score: float     # 0.0 ~ 1.0
    task_score: float     # 0.0 ~ 1.0

@router.post("/final")
def calculate_final_score(data: FinalInput):
    final_score = 0.4 * data.emotion_score + 0.3 * data.gaze_score + 0.3 * data.task_score
    return {"finalScore": round(final_score, 3)}