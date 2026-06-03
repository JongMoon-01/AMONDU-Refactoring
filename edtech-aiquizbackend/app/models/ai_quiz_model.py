from sqlalchemy import Column, Integer, String, Enum, JSON
from app.database import Base
import enum

# 퀴즈 유형 열거형
class QuizTypeEnum(str, enum.Enum):
    OX = "OX"
    MCQ = "MCQ"  # Multiple Choice Question

# AIQuiz 테이블 모델
class AIQuiz(Base):
    __tablename__ = "ai_quiz"

    id = Column(Integer, primary_key=True, index=True)
    summary_id = Column(Integer, index=True)
    user_id = Column(String(255), index=True)
    quiz_type = Column(Enum(QuizTypeEnum, native_enum=False), nullable=False)
    quiz_text = Column(String(1000), nullable=False)
    options = Column(JSON, nullable=False)  # ✅ 보기 저장용 JSON 컬럼 추가
    answer = Column(String(255), nullable=False)