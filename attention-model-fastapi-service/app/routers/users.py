from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db, Session as DBSession, Score, UserStats, FrameData
from app.dependencies import get_current_user_id

router = APIRouter()


# ── Pydantic 모델 ──────────────────────────────────────────

class SessionCreate(BaseModel):
    session_name: Optional[str] = None
    model_type: str = "advanced"
    device_info: Optional[str] = None


class SessionResponse(BaseModel):
    id: int
    user_id: int
    session_name: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    total_frames: int
    is_active: bool
    model_type: str

    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    user_id: int
    total_sessions: int
    total_analysis_time: float
    total_frames: int
    avg_emotion_score: float
    avg_gaze_score: float
    avg_final_score: float
    best_emotion_score: float
    best_gaze_score: float
    best_final_score: float
    grade_a_count: int
    grade_b_count: int
    grade_c_count: int
    last_updated: datetime

    class Config:
        from_attributes = True


# ── 세션 관리 API ──────────────────────────────────────────

@router.post("/sessions/", response_model=SessionResponse)
def create_session(
    session: SessionCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """새 분석 세션 시작 (JWT에서 userId 추출)"""
    try:
        # 기존 활성 세션 종료
        active_session = db.query(DBSession).filter(
            DBSession.user_id == user_id,
            DBSession.is_active is True
        ).first()

        if active_session:
            active_session.is_active = False
            active_session.end_time = datetime.utcnow()
            if active_session.start_time:
                active_session.duration_minutes = (
                    active_session.end_time - active_session.start_time
                ).total_seconds() / 60

        db_session = DBSession(
            user_id=user_id,
            session_name=session.session_name or f"Session {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            model_type=session.model_type,
            device_info=session.device_info
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)

        return db_session

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get("/sessions/", response_model=List[SessionResponse])
def get_my_sessions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """내 세션 목록 조회"""
    sessions = db.query(DBSession).filter(
        DBSession.user_id == user_id
    ).order_by(desc(DBSession.start_time)).offset(skip).limit(limit).all()

    return sessions


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """특정 세션 조회"""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session


@router.post("/sessions/{session_id}/end")
def end_session(session_id: int, db: Session = Depends(get_db)):
    """세션 종료"""
    try:
        session = db.query(DBSession).filter(DBSession.id == session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        if not session.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is already ended"
            )

        session.is_active = False
        session.end_time = datetime.utcnow()
        if session.start_time:
            session.duration_minutes = (
                session.end_time - session.start_time
            ).total_seconds() / 60

        frame_count = db.query(func.count(FrameData.id)).filter(
            FrameData.session_id == session_id
        ).scalar()
        session.total_frames = frame_count or 0

        db.commit()

        _update_user_stats(session.user_id, db)

        return {
            "message": "Session ended successfully",
            "session_id": session_id,
            "duration_minutes": session.duration_minutes,
            "total_frames": session.total_frames
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to end session: {str(e)}"
        )


# ── 통계 API ───────────────────────────────────────────────

@router.get("/stats/", response_model=UserStatsResponse)
def get_my_stats(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """내 통계 조회"""
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not stats:
        stats = UserStats(user_id=user_id)
        db.add(stats)
        db.commit()
        db.refresh(stats)

    return stats


@router.post("/stats/refresh")
def refresh_my_stats(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """내 통계 강제 새로고침"""
    try:
        _update_user_stats(user_id, db)
        return {"message": "Statistics refreshed successfully", "user_id": user_id}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh stats: {str(e)}"
        )


# ── 내부 함수 ──────────────────────────────────────────────

def _update_user_stats(user_id: int, db: Session):
    """사용자 통계 업데이트"""
    try:
        stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
        if not stats:
            stats = UserStats(user_id=user_id)
            db.add(stats)

        session_stats = db.query(
            func.count(DBSession.id),
            func.sum(DBSession.duration_minutes),
            func.sum(DBSession.total_frames)
        ).filter(DBSession.user_id == user_id).first()

        stats.total_sessions = session_stats[0] or 0
        stats.total_analysis_time = session_stats[1] or 0.0
        stats.total_frames = session_stats[2] or 0

        score_stats = db.query(
            func.avg(Score.emotion_score),
            func.avg(Score.gaze_score),
            func.avg(Score.final_score),
            func.max(Score.emotion_score),
            func.max(Score.gaze_score),
            func.max(Score.final_score)
        ).filter(Score.user_id == user_id).first()

        if score_stats[0]:
            stats.avg_emotion_score = round(score_stats[0], 3)
            stats.avg_gaze_score = round(score_stats[1], 3)
            stats.avg_final_score = round(score_stats[2], 3)
            stats.best_emotion_score = round(score_stats[3], 3)
            stats.best_gaze_score = round(score_stats[4], 3)
            stats.best_final_score = round(score_stats[5], 3)

        grade_counts = db.query(
            Score.grade,
            func.count(Score.id)
        ).filter(Score.user_id == user_id).group_by(Score.grade).all()

        grade_dict = {grade: count for grade, count in grade_counts}
        stats.grade_a_count = grade_dict.get('A', 0)
        stats.grade_b_count = grade_dict.get('B', 0)
        stats.grade_c_count = grade_dict.get('C', 0)

        stats.last_updated = datetime.utcnow()
        db.commit()

    except Exception as e:
        db.rollback()
        raise e
