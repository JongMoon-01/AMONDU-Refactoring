# app/api/endpoints.py  (Kafka 발행 추가 버전)
# 위치: edtech-aiquizbackend/app/api/endpoints.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.schema import LlmQuizRequest, QuizItem
from app.services.database import get_db
from app.services.quiz_service import generate_from_intervals
from app.kafka_producer import publish_quiz_generated

router = APIRouter()


@router.post("/llm/quiz-from-intervals", response_model=List[QuizItem])
def quiz_from_intervals(
    req: LlmQuizRequest, db: Session = Depends(get_db)
):
    try:
        items = generate_from_intervals(req)
        if not items:
            raise HTTPException(
                status_code=400, detail="컨텍스트가 비어있거나 생성 실패"
            )

        # Kafka — quiz.generated 발행
        publish_quiz_generated(
            user_id=req.userId,
            class_id=req.classId,
            course_id=req.courseId,
            lecture_id=req.lectureId,
            quiz_count=len(items),
        )

        return items
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"퀴즈 생성 실패: {e}")
