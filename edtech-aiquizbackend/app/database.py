# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# ✅ .env 파일에서 환경 변수 로드
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ DB 연결 설정
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base 선언 (모든 모델은 이 Base를 상속)
Base = declarative_base()

# ✅ FastAPI 의존성 주입용 DB 세션
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
