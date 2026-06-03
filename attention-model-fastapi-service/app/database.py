from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from datetime import datetime

# MySQL 데이터베이스 설정
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:password@localhost:3306/focus_analysis"
)

# 개발 환경용 로컬 MySQL 설정
if "localhost" in DATABASE_URL:
    # 로컬 개발용 설정 (Docker MySQL 또는 로컬 MySQL)
    DATABASE_URL = "mysql+pymysql://root:focus123@localhost:3306/focus_analysis"

# SQLAlchemy 설정
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False  # SQL 쿼리 로깅 (개발시 True로 설정)
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 데이터베이스 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 사용자 모델
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계
    sessions = relationship("Session", back_populates="user")
    scores = relationship("Score", back_populates="user")

# 세션 모델 (분석 세션)
class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_name = Column(String(200), nullable=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Float, nullable=True)
    total_frames = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    model_type = Column(String(20), default="advanced")  # "basic" or "advanced"
    
    # 세션 메타데이터
    device_info = Column(Text, nullable=True)  # JSON 형태
    session_config = Column(Text, nullable=True)  # JSON 형태
    
    # 관계
    user = relationship("User", back_populates="sessions")
    scores = relationship("Score", back_populates="session")
    frame_data = relationship("FrameData", back_populates="session")
    
    # 인덱스
    __table_args__ = (
        Index('idx_user_start_time', 'user_id', 'start_time'),
    )

# 점수 모델 (집계된 점수)
class Score(Base):
    __tablename__ = "scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    
    # 점수들
    emotion_score = Column(Float, nullable=False)
    gaze_score = Column(Float, nullable=False)
    task_score = Column(Float, default=0.7)  # 기본값
    final_score = Column(Float, nullable=False)
    
    # 메타데이터
    confidence_level = Column(String(10), nullable=True)  # "high", "medium", "low"
    grade = Column(String(5), nullable=True)  # "A", "B", "C"
    feedback_message = Column(Text, nullable=True)
    
    # 시간 정보
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    frame_count = Column(Integer, default=1)
    
    # 관계
    user = relationship("User", back_populates="scores")
    session = relationship("Session", back_populates="scores")
    
    # 인덱스
    __table_args__ = (
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
    )

# 프레임 데이터 모델 (상세 분석 결과)
class FrameData(Base):
    __tablename__ = "frame_data"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    
    # 프레임 정보
    frame_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    processing_time = Column(Float, nullable=True)
    
    # 감정 분석 결과
    emotion_happy = Column(Float, default=0.0)
    emotion_sad = Column(Float, default=0.0)
    emotion_angry = Column(Float, default=0.0)
    emotion_fear = Column(Float, default=0.0)
    emotion_surprise = Column(Float, default=0.0)
    emotion_disgust = Column(Float, default=0.0)
    emotion_neutral = Column(Float, default=0.0)
    emotion_confidence = Column(String(10), nullable=True)
    
    # 시선 분석 결과
    face_detected = Column(Boolean, default=False)
    eyes_detected = Column(Boolean, default=False)
    gaze_direction = Column(String(20), nullable=True)  # "center", "left", "right", etc.
    attention_score = Column(Float, default=0.0)
    gaze_confidence = Column(Float, default=0.0)
    
    # 계산된 점수
    emotion_score = Column(Float, nullable=False)
    gaze_score = Column(Float, nullable=False)
    
    # 관계
    session = relationship("Session", back_populates="frame_data")
    
    # 인덱스
    __table_args__ = (
        Index('idx_session_frame', 'session_id', 'frame_id'),
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
    )

# 통계 모델 (사용자별 누적 통계)
class UserStats(Base):
    __tablename__ = "user_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # 누적 통계
    total_sessions = Column(Integer, default=0)
    total_analysis_time = Column(Float, default=0.0)  # 분 단위
    total_frames = Column(Integer, default=0)
    
    # 평균 점수
    avg_emotion_score = Column(Float, default=0.0)
    avg_gaze_score = Column(Float, default=0.0)
    avg_final_score = Column(Float, default=0.0)
    
    # 최고 점수
    best_emotion_score = Column(Float, default=0.0)
    best_gaze_score = Column(Float, default=0.0)
    best_final_score = Column(Float, default=0.0)
    
    # 등급 분포
    grade_a_count = Column(Integer, default=0)
    grade_b_count = Column(Integer, default=0)
    grade_c_count = Column(Integer, default=0)
    
    # 업데이트 시간
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계
    user = relationship("User")

# 데이터베이스 테이블 생성
def create_tables():
    """데이터베이스 테이블 생성"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

# 데이터베이스 초기화
def init_database():
    """데이터베이스 초기화 및 기본 데이터 생성"""
    create_tables()
    
    # 기본 사용자 생성 (테스트용)
    db = SessionLocal()
    try:
        # 기본 사용자가 없으면 생성
        existing_user = db.query(User).filter(User.username == "demo_user").first()
        if not existing_user:
            demo_user = User(
                username="demo_user",
                email="demo@example.com",
                full_name="Demo User"
            )
            db.add(demo_user)
            
            # 기본 통계 생성
            user_stats = UserStats(user_id=1)  # demo_user의 ID가 1이라 가정
            db.add(user_stats)
            
            db.commit()
            print("Demo user created successfully")
        else:
            print("Demo user already exists")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()