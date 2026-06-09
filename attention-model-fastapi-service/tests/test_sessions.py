"""
통합 테스트: 세션/통계 API
minikube 실행 중 필요:
  kubectl port-forward svc/attention-service 8001:8001
"""
import pytest
import httpx
from conftest import BASE_URL, make_token

pytestmark = pytest.mark.integration  # -m integration 으로 선택 실행 가능


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as c:
        yield c


@pytest.fixture(scope="module")
def user_headers():
    token = make_token(user_id=9001)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def other_user_headers():
    token = make_token(user_id=9002)
    return {"Authorization": f"Bearer {token}"}


# ── 서비스 헬스 체크 ─────────────────────────────────────

class TestHealth:

    def test_root_alive(self, client):
        """서비스 기동 확인"""
        res = client.get("/")
        assert res.status_code == 200
        assert "2.1.0" in res.json().get("version", "")


# ── 세션 생성 ────────────────────────────────────────────

class TestCreateSession:

    def test_create_session_success(self, client, user_headers):
        """정상 세션 생성"""
        res = client.post("/api/sessions/", json={
            "session_name": "테스트 강의",
            "model_type": "advanced"
        }, headers=user_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == 9001
        assert data["is_active"] is True
        assert data["session_name"] == "테스트 강의"

    def test_create_session_without_token(self, client):
        """토큰 없이 세션 생성 시도 → 401"""
        res = client.post("/api/sessions/", json={"session_name": "무단 접근"})
        assert res.status_code == 401

    def test_create_session_with_expired_token(self, client):
        """만료 토큰으로 세션 생성 시도 → 401"""
        expired = make_token(user_id=9001, expired=True)
        res = client.post("/api/sessions/", json={}, headers={
            "Authorization": f"Bearer {expired}"
        })
        assert res.status_code == 401

    def test_duplicate_session_auto_closes_previous(self, client, user_headers):
        """활성 세션 있는 상태에서 새 세션 생성 → 기존 세션 자동 종료"""
        # 첫 번째 세션
        res1 = client.post("/api/sessions/", json={"session_name": "강의1"}, headers=user_headers)
        assert res1.status_code == 200
        session1_id = res1.json()["id"]

        # 두 번째 세션 생성
        res2 = client.post("/api/sessions/", json={"session_name": "강의2"}, headers=user_headers)
        assert res2.status_code == 200
        session2_id = res2.json()["id"]
        assert session2_id != session1_id

        # 첫 번째 세션이 종료됐는지 확인
        res_check = client.get(f"/api/sessions/{session1_id}", headers=user_headers)
        assert res_check.json()["is_active"] is False


# ── 세션 조회 ────────────────────────────────────────────

class TestGetSessions:

    def test_get_my_sessions(self, client, user_headers):
        """내 세션 목록 조회"""
        res = client.get("/api/sessions/", headers=user_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        # 모두 내 userId
        for s in res.json():
            assert s["user_id"] == 9001

    def test_other_user_sessions_not_visible(self, client, user_headers, other_user_headers):
        """다른 유저 세션이 내 목록에 안 보임"""
        # 다른 유저 세션 생성
        client.post("/api/sessions/", json={"session_name": "타인 세션"}, headers=other_user_headers)

        # 내 세션 목록에서 타인 session 없음
        res = client.get("/api/sessions/", headers=user_headers)
        for s in res.json():
            assert s["user_id"] == 9001

    def test_get_sessions_without_token(self, client):
        """토큰 없이 조회 → 401"""
        res = client.get("/api/sessions/")
        assert res.status_code == 401


# ── 세션 종료 ────────────────────────────────────────────

class TestEndSession:

    def test_end_session(self, client, user_headers):
        """세션 종료 후 is_active=False, duration 존재"""
        res = client.post("/api/sessions/", json={"session_name": "종료 테스트"}, headers=user_headers)
        session_id = res.json()["id"]

        end_res = client.post(f"/api/sessions/{session_id}/end")
        assert end_res.status_code == 200
        assert end_res.json()["duration_minutes"] is not None

    def test_end_already_ended_session(self, client, user_headers):
        """이미 종료된 세션 재종료 → 400"""
        res = client.post("/api/sessions/", json={}, headers=user_headers)
        session_id = res.json()["id"]
        client.post(f"/api/sessions/{session_id}/end")

        res2 = client.post(f"/api/sessions/{session_id}/end")
        assert res2.status_code == 400


# ── 통계 ─────────────────────────────────────────────────

class TestStats:

    def test_get_my_stats(self, client, user_headers):
        """내 통계 조회"""
        res = client.get("/api/stats/", headers=user_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == 9001
        assert "total_sessions" in data

    def test_get_stats_without_token(self, client):
        """토큰 없이 통계 조회 → 401"""
        res = client.get("/api/stats/")
        assert res.status_code == 401


# ── 제거된 엔드포인트 확인 ────────────────────────────────

class TestRemovedEndpoints:

    def test_users_create_removed(self, client):
        """/api/users/ POST 제거 확인 → 404 또는 405"""
        res = client.post("/api/users/", json={"username": "test"})
        assert res.status_code in (404, 405)

    def test_users_list_removed(self, client):
        """/api/users/ GET 제거 확인 → 404 또는 405"""
        res = client.get("/api/users/")
        assert res.status_code in (404, 405)
