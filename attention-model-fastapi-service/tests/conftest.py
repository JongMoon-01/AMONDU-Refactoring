import pytest
import jwt
import os
import httpx

# 테스트용 JWT 설정 (실제 환경과 동일한 secret 사용)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

# minikube 서비스 주소
# kubectl port-forward svc/attention-service 8001:8001 실행 후 사용
BASE_URL = os.getenv("ATTENTION_BASE_URL", "http://localhost:8001")


def make_token(user_id: int, expired: bool = False) -> str:
    """테스트용 JWT 생성"""
    import time
    payload = {
        "userId": user_id,
        "sub": f"test_user_{user_id}@amondu.com",
        "exp": int(time.time()) + (-10 if expired else 3600)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@pytest.fixture
def valid_token():
    return make_token(user_id=9001)


@pytest.fixture
def expired_token():
    return make_token(user_id=9001, expired=True)


@pytest.fixture
def auth_headers(valid_token):
    return {"Authorization": f"Bearer {valid_token}"}


@pytest.fixture
def client():
    return httpx.Client(base_url=BASE_URL, timeout=10.0)
