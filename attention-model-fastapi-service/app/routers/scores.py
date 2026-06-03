from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db, User, Session as DBSession, Score, FrameData

router = APIRouter()

# Pydantic 모델들
class ScoreCreate(BaseModel):
    session_id: int
    emotion_score: float
    gaze_score: float
    task_score: float = 0.7
    confidence_level: Optional[str] = "medium"
    frame_count: int = 1

class ScoreResponse(BaseModel):
    id: int
    user_id: int
    session_id: int
    emotion_score: float
    gaze_score: float
    task_score: float
    final_score: float
    confidence_level: Optional[str]
    grade: Optional[str]
    feedback_message: Optional[str]
    timestamp: datetime
    frame_count: int
    
    class Config:
        from_attributes = True

# 점수 저장 API
@router.post("/scores/", response_model=ScoreResponse)
def create_score(score: ScoreCreate, db: Session = Depends(get_db)):
    """새로운 점수 저장"""
    try:
        # 세션 존재 확인
        session = db.query(DBSession).filter(DBSession.id == score.session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # 최종 점수 계산 (가중치: 감정 0.4, 시선 0.3, 작업 0.3)
        final_score = 0.4 * score.emotion_score + 0.3 * score.gaze_score + 0.3 * score.task_score
        
        # 등급 계산
        if final_score >= 0.8:
            grade = "A"
        elif final_score >= 0.6:
            grade = "B"
        else:
            grade = "C"
        
        # 피드백 메시지 생성
        if final_score >= 0.8:
            feedback_message = "훌륭한 집중도입니다!"
        elif final_score >= 0.6:
            feedback_message = "좋은 집중도를 유지하고 있습니다."
        else:
            feedback_message = "집중도 개선이 필요합니다."
        
        # 점수 저장
        db_score = Score(
            user_id=session.user_id,
            session_id=score.session_id,
            emotion_score=round(score.emotion_score, 3),
            gaze_score=round(score.gaze_score, 3),
            task_score=round(score.task_score, 3),
            final_score=round(final_score, 3),
            confidence_level=score.confidence_level,
            grade=grade,
            feedback_message=feedback_message,
            frame_count=score.frame_count
        )
        
        db.add(db_score)
        db.commit()
        db.refresh(db_score)
        
        return db_score
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create score: {str(e)}"
        )

@router.get("/scores/", response_model=List[ScoreResponse])
def get_scores(
    user_id: Optional[int] = None,
    session_id: Optional[int] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    """점수 목록 조회"""
    query = db.query(Score)
    
    if user_id:
        query = query.filter(Score.user_id == user_id)
    if session_id:
        query = query.filter(Score.session_id == session_id)
    
    scores = query.order_by(desc(Score.timestamp)).offset(skip).limit(limit).all()
    return scores

@router.get("/analytics/{user_id}")
def get_user_analytics(user_id: int, days: int = 30, db: Session = Depends(get_db)):
    """사용자 분석 데이터 및 동향 조회"""
    try:
        # 사용자 존재 확인
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # 기간 설정
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # 기간 내 점수 통계
        score_stats = db.query(
            func.count(Score.id),
            func.avg(Score.emotion_score),
            func.avg(Score.gaze_score),
            func.avg(Score.final_score),
            func.max(Score.final_score),
            func.min(Score.final_score)
        ).filter(
            and_(
                Score.user_id == user_id,
                Score.timestamp >= start_date,
                Score.timestamp <= end_date
            )
        ).first()
        
        # 등급 분포
        grade_counts = db.query(
            Score.grade,
            func.count(Score.id)
        ).filter(
            and_(
                Score.user_id == user_id,
                Score.timestamp >= start_date,
                Score.timestamp <= end_date
            )
        ).group_by(Score.grade).all()
        
        grade_dict = {grade: count for grade, count in grade_counts}
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_scores": score_stats[0] or 0,
            "average_scores": {
                "emotion": round(score_stats[1] or 0.0, 3),
                "gaze": round(score_stats[2] or 0.0, 3),
                "final": round(score_stats[3] or 0.0, 3)
            },
            "best_final_score": round(score_stats[4] or 0.0, 3),
            "worst_final_score": round(score_stats[5] or 0.0, 3),
            "grade_distribution": {
                "A": grade_dict.get("A", 0),
                "B": grade_dict.get("B", 0),
                "C": grade_dict.get("C", 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )

@router.get("/session-analytics/{session_id}")
def get_session_analytics(session_id: int, db: Session = Depends(get_db)):
    """세션별 상세 분석"""
    try:
        # 세션 존재 확인
        session = db.query(DBSession).filter(DBSession.id == session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # 세션 점수 통계
        score_stats = db.query(
            func.count(Score.id),
            func.avg(Score.emotion_score),
            func.avg(Score.gaze_score),
            func.avg(Score.final_score),
            func.max(Score.final_score),
            func.min(Score.final_score)
        ).filter(Score.session_id == session_id).first()
        
        return {
            "session_id": session_id,
            "session_info": {
                "name": session.session_name,
                "start_time": session.start_time,
                "end_time": session.end_time,
                "duration_minutes": session.duration_minutes,
                "model_type": session.model_type,
                "is_active": session.is_active
            },
            "score_statistics": {
                "total_scores": score_stats[0] or 0,
                "avg_emotion_score": round(score_stats[1] or 0.0, 3),
                "avg_gaze_score": round(score_stats[2] or 0.0, 3),
                "avg_final_score": round(score_stats[3] or 0.0, 3),
                "max_final_score": round(score_stats[4] or 0.0, 3),
                "min_final_score": round(score_stats[5] or 0.0, 3)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session analytics: {str(e)}"
        )