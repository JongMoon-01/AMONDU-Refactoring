# app/api/endpoints.py (핵심 부분만)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.schema import LlmQuizRequest, QuizItem
from app.services.database import get_db
from app.services.quiz_service import generate_from_intervals

router = APIRouter()

@router.post("/llm/quiz-from-intervals", response_model=List[QuizItem])
def quiz_from_intervals(req: LlmQuizRequest, db: Session = Depends(get_db)):
    try:
        items = generate_from_intervals(req)
        if not items:
            raise HTTPException(status_code=400, detail="컨텍스트가 비어있거나 생성 실패")
        return items
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"퀴즈 생성 실패: {e}")
