from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class FeedbackInput(BaseModel):
    final_score: float

@router.post("/feedback")
def give_feedback(data: FeedbackInput):
    score = data.final_score

    if score >= 0.8:
        grade = "A"
        message = "훌륭한 집중력이에요! 지금처럼 계속 유지해봐요."
    elif score >= 0.6:
        grade = "B"
        message = "집중도가 괜찮아요. 잠깐의 휴식도 고려해보세요."
    else:
        grade = "C"
        message = "집중력이 떨어지고 있어요. 자세를 고쳐보거나 쉬는 것도 좋아요."

    return {"grade": grade, "message": message}