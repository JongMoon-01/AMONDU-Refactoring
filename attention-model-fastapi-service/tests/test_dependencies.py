"""
단위 테스트: app/dependencies.py (JWT 파싱)
DB/네트워크 불필요 — 순수 로직 검증
"""
import pytest
import jwt
import time
from unittest.mock import patch
from fastapi import HTTPException

from app.dependencies import get_current_user_id, JWT_SECRET, JWT_ALGORITHM


def _make_token(payload: dict) -> str:
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ── 정상 케이스 ──────────────────────────────────────────

class TestGetCurrentUserId:

    def test_valid_token_with_userId_claim(self):
        """userId 클레임이 있는 정상 토큰"""
        token = _make_token({"userId": 42, "exp": int(time.time()) + 3600})
        result = get_current_user_id(authorization=f"Bearer {token}")
        assert result == 42

    def test_valid_token_with_sub_claim(self):
        """userId 없고 sub 클레임만 있는 토큰 (fallback)"""
        token = _make_token({"sub": "99", "exp": int(time.time()) + 3600})
        result = get_current_user_id(authorization=f"Bearer {token}")
        assert result == 99

    def test_userId_takes_priority_over_sub(self):
        """userId와 sub 둘 다 있으면 userId 우선"""
        token = _make_token({"userId": 42, "sub": "99", "exp": int(time.time()) + 3600})
        result = get_current_user_id(authorization=f"Bearer {token}")
        assert result == 42

    def test_returns_int(self):
        """반환값이 반드시 int"""
        token = _make_token({"userId": "77", "exp": int(time.time()) + 3600})
        result = get_current_user_id(authorization=f"Bearer {token}")
        assert isinstance(result, int)
        assert result == 77


# ── 에러 케이스 ──────────────────────────────────────────

class TestGetCurrentUserIdErrors:

    def test_missing_authorization_header(self):
        """Authorization 헤더 없음 → 401"""
        with pytest.raises(HTTPException) as exc:
            get_current_user_id(authorization=None)
        assert exc.value.status_code == 401

    def test_invalid_header_format(self):
        """Bearer 형식 아님 → 401"""
        with pytest.raises(HTTPException) as exc:
            get_current_user_id(authorization="Token abc123")
        assert exc.value.status_code == 401

    def test_expired_token(self):
        """만료된 토큰 → 401, 'expired' 메시지"""
        token = _make_token({"userId": 42, "exp": int(time.time()) - 10})
        with pytest.raises(HTTPException) as exc:
            get_current_user_id(authorization=f"Bearer {token}")
        assert exc.value.status_code == 401
        assert "expired" in exc.value.detail.lower()

    def test_invalid_signature(self):
        """잘못된 secret으로 서명된 토큰 → 401"""
        token = jwt.encode({"userId": 42}, "wrong-secret", algorithm="HS256")
        with pytest.raises(HTTPException) as exc:
            get_current_user_id(authorization=f"Bearer {token}")
        assert exc.value.status_code == 401

    def test_token_missing_user_claim(self):
        """userId/sub 클레임 둘 다 없음 → 401"""
        token = _make_token({"role": "admin", "exp": int(time.time()) + 3600})
        with pytest.raises(HTTPException) as exc:
            get_current_user_id(authorization=f"Bearer {token}")
        assert exc.value.status_code == 401

    def test_malformed_token(self):
        """완전히 깨진 토큰 → 401"""
        with pytest.raises(HTTPException) as exc:
            get_current_user_id(authorization="Bearer not.a.token")
        assert exc.value.status_code == 401
