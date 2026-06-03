from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.database import get_db, User, Session as DBSession, Score, UserStats, FrameData

router = APIRouter()

# Pydantic 모델들
class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

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

# 사용자 관리 API들
@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """새 사용자 생성"""
    try:
        # 중복 사용자명 확인
        existing_user = db.query(User).filter(User.username == user.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # 중복 이메일 확인
        if user.email:
            existing_email = db.query(User).filter(User.email == user.email).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # 새 사용자 생성
        db_user = User(
            username=user.username,
            email=user.email,
            full_name=user.full_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # 사용자 통계 초기화
        user_stats = UserStats(user_id=db_user.id)
        db.add(user_stats)
        db.commit()
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """사용자 목록 조회"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """특정 사용자 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/users/username/{username}", response_model=UserResponse)
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    """사용자명으로 사용자 조회"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# 세션 관리 API들
@router.post("/users/{user_id}/sessions/", response_model=SessionResponse)
def create_session(user_id: int, session: SessionCreate, db: Session = Depends(get_db)):
    """새 분석 세션 시작"""
    try:
        # 사용자 존재 확인
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # 기존 활성 세션이 있으면 종료
        active_session = db.query(DBSession).filter(
            DBSession.user_id == user_id,
            DBSession.is_active == True
        ).first()
        
        if active_session:
            active_session.is_active = False
            active_session.end_time = datetime.utcnow()
            if active_session.start_time:
                active_session.duration_minutes = (
                    active_session.end_time - active_session.start_time
                ).total_seconds() / 60
        
        # 새 세션 생성
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
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )

@router.get("/users/{user_id}/sessions/", response_model=List[SessionResponse])
def get_user_sessions(user_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """사용자의 세션 목록 조회"""
    # 사용자 존재 확인
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
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
        
        # 세션 종료
        session.is_active = False
        session.end_time = datetime.utcnow()
        if session.start_time:
            session.duration_minutes = (
                session.end_time - session.start_time
            ).total_seconds() / 60
        
        # 프레임 수 업데이트
        frame_count = db.query(func.count(FrameData.id)).filter(
            FrameData.session_id == session_id
        ).scalar()
        session.total_frames = frame_count or 0
        
        db.commit()
        
        # 사용자 통계 업데이트
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

@router.get("/users/{user_id}/stats", response_model=UserStatsResponse)
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """사용자 통계 조회"""
    # 사용자 존재 확인
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 통계 조회
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not stats:
        # 통계가 없으면 생성
        stats = UserStats(user_id=user_id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return stats

@router.post("/users/{user_id}/stats/refresh")
def refresh_user_stats(user_id: int, db: Session = Depends(get_db)):
    """사용자 통계 강제 새로고침"""
    try:
        # 사용자 존재 확인
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # 통계 업데이트
        _update_user_stats(user_id, db)
        
        # 업데이트된 통계 조회
        stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
        
        return {
            "message": "User statistics refreshed successfully",
            "user_id": user_id,
            "stats": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh user stats: {str(e)}"
        )

def _update_user_stats(user_id: int, db: Session):
    """사용자 통계 업데이트 (내부 함수)"""
    try:
        # 기존 통계 조회 또는 생성
        stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
        if not stats:
            stats = UserStats(user_id=user_id)
            db.add(stats)
        
        # 세션 통계 계산
        session_stats = db.query(
            func.count(DBSession.id),
            func.sum(DBSession.duration_minutes),
            func.sum(DBSession.total_frames)
        ).filter(DBSession.user_id == user_id).first()
        
        stats.total_sessions = session_stats[0] or 0
        stats.total_analysis_time = session_stats[1] or 0.0
        stats.total_frames = session_stats[2] or 0
        
        # 점수 통계 계산
        score_stats = db.query(
            func.avg(Score.emotion_score),
            func.avg(Score.gaze_score),
            func.avg(Score.final_score),
            func.max(Score.emotion_score),
            func.max(Score.gaze_score),
            func.max(Score.final_score)
        ).filter(Score.user_id == user_id).first()
        
        if score_stats[0]:  # 점수가 있는 경우만
            stats.avg_emotion_score = round(score_stats[0], 3)
            stats.avg_gaze_score = round(score_stats[1], 3)
            stats.avg_final_score = round(score_stats[2], 3)
            stats.best_emotion_score = round(score_stats[3], 3)
            stats.best_gaze_score = round(score_stats[4], 3)
            stats.best_final_score = round(score_stats[5], 3)
        
        # 등급 분포 계산
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