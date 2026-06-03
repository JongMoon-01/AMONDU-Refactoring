from sqlalchemy import Column, Integer, BigInteger, Text, String, DateTime, ForeignKey
from app.database import Base
from datetime import datetime

class Summary(Base):
    __tablename__ = "summary"

    summary_id = Column(BigInteger, primary_key=True, index=True)
    lecture_id = Column(BigInteger, nullable=False)
    user_id = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    time = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
