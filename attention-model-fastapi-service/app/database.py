from sqlalchemy import (
    create_engine, Column, Integer, BigInteger, String,
    Float, DateTime, Boolean, Text, ForeignKey, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os

# MySQL 데이터베이스 설정
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:focus123@localhost:3306/focus_analysis"
)

# SQLAlchemy 설정
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 세션 모델 (분석 세션)
# user_id는 edtech-backend JWT에서 추출한 Long 값 (FK 없음 - Database per Service)
class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False, index=True)  # edtech.User.userId 참조 (논리적)
    session_name = Column(String(200), nullable=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Float, nullable=True)
    total_frames = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    model_type = Column(String(20), default="advanced")  # "basic" or "advanced"

    device_info = Column(Text, nullable=True)    # JSON 형태
    session_config = Column(Text, nullable=True)  # JSON 형태

    scores = relationship("Score", back_populates="session")
    frame_data = relationship("FrameData", back_populates="session")

    __table_args__ = (
        Index('idx_user_start_time', 'user_id', 'start_time'),
    )


# 점수 모델 (집계된 점수)
class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False, index=True)  # edtech.User.userId 참조 (논리적)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)

    emotion_score = Column(Float, nullable=False)
    gaze_score = Column(Float, nullable=False)
    task_score = Column(Float, default=0.7)
    final_score = Column(Float, nullable=False)

    confidence_level = Column(String(10), nullable=True)  # "high", "medium", "low"
    grade = Column(String(5), nullable=True)               # "A", "B", "C"
    feedback_message = Column(Text, nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    frame_count = Column(Integer, default=1)

    session = relationship("Session", back_populates="scores")

    __table_args__ = (
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
    )


# 프레임 데이터 모델 (상세 분석 결과)
class FrameData(Base):
    __tablename__ = "frame_data"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)

    frame_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    processing_time = Column(Float, nullable=True)

    emotion_happy = Column(Float, default=0.0)
    emotion_sad = Column(Float, default=0.0)
    emotion_angry = Column(Float, default=0.0)
    emotion_fear = Column(Float, default=0.0)
    emotion_surprise = Column(Float, default=0.0)
    emotion_disgust = Column(Float, default=0.0)
    emotion_neutral = Column(Float, default=0.0)
    emotion_confidence = Column(String(10), nullable=True)

    face_detected = Column(Boolean, default=False)
    eyes_detected = Column(Boolean, default=False)
    gaze_direction = Column(String(20), nullable=True)
    attention_score = Column(Float, default=0.0)
    gaze_confidence = Column(Float, default=0.0)

    emotion_score = Column(Float, nullable=False)
    gaze_score = Column(Float, nullable=False)

    session = relationship("Session", back_populates="frame_data")

    __table_args__ = (
        Index('idx_session_frame', 'session_id', 'frame_id'),
        Index('idx_session_ts', 'session_id', 'timestamp'),
    )


# 통계 모델 (사용자별 누적 통계)
class UserStats(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False, unique=True, index=True)  # edtech.User.userId 참조 (논리적)

    total_sessions = Column(Integer, default=0)
    total_analysis_time = Column(Float, default=0.0)  # 분 단위
    total_frames = Column(Integer, default=0)

    avg_emotion_score = Column(Float, default=0.0)
    avg_gaze_score = Column(Float, default=0.0)
    avg_final_score = Column(Float, default=0.0)

    best_emotion_score = Column(Float, default=0.0)
    best_gaze_score = Column(Float, default=0.0)
    best_final_score = Column(Float, default=0.0)

    grade_a_count = Column(Integer, default=0)
    grade_b_count = Column(Integer, default=0)
    grade_c_count = Column(Integer, default=0)

    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
