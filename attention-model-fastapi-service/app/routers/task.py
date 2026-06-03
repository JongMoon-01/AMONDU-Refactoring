from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class TaskInput(BaseModel):
    quiz_score: float  # 응답률 (0~1)
    click_score: float  # 클릭률 (0~1)
    speech_score: float  # 발언 여부 (0 or 1)

@router.post("/task")
def calculate_task_score(data: TaskInput):
    task_score = (data.quiz_score + data.click_score + data.speech_score) / 3
    return {"taskScore": round(task_score, 3)}