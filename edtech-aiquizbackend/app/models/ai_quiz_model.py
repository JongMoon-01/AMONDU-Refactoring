from sqlalchemy import Column, Integer, BigInteger, String, Enum, JSON
from app.database import Base
import enum


class QuizTypeEnum(str, enum.Enum):
    OX = "OX"
    MCQ = "MCQ"  # Multiple Choice Question


class AIQuiz(Base):
    __tablename__ = "ai_quiz"

    id = Column(Integer, primary_key=True, index=True)
    # edtech.Summary.summaryId 논리적 참조 (FK 없음 - Database per Service)
    summary_id = Column(BigInteger, index=True, nullable=True)
    user_id = Column(String(255), index=True)
    quiz_type = Column(Enum(QuizTypeEnum, native_enum=False), nullable=False)
    quiz_text = Column(String(1000), nullable=False)
    options = Column(JSON, nullable=False)
    answer = Column(String(255), nullable=False)
