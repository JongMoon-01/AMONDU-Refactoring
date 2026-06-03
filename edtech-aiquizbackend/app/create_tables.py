from app.database import Base, engine  # Base와 engine import
from app.models.ai_quiz_model import AIQuiz  # 테이블 모델 import

print("🟢 테이블 생성 시작...")

# ✅ 모든 모델 기반으로 테이블 생성
Base.metadata.create_all(bind=engine)

print("✅ 테이블 생성 완료.")
