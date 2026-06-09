"""
통합 테스트: 점수 저장 및 분석 API
minikube 실행 중 필요:
  kubectl port-forward svc/attention-service 8001:8001
"""
import pytest
import httpx
from conftest import BASE_URL, make_token

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as c:
        yield c


@pytest.fixture(scope="module")
def session_id(client):
    """테스트용 세션 미리 생성"""
    token = make_token(user_id=9001)
    res = client.post("/api/sessions/", json={"session_name": "점수 테스트 세션"}, headers={
        "Authorization": f"Bearer {token}"
    })
    assert res.status_code == 200
    return res.json()["id"]


# ── 점수 저장 ────────────────────────────────────────────

class TestCreateScore:

    def test_create_score_success(self, client, session_id):
        """정상 점수 저장"""
        res = client.post("/api/scores/", json={
            "session_id": session_id,
            "emotion_score": 0.85,
            "gaze_score": 0.72,
            "task_score": 0.80,
            "frame_count": 30
        })
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == 9001       # session에서 자동 세팅
        assert data["session_id"] == session_id
        assert data["grade"] in ("A", "B", "C")
        assert 0 <= data["final_score"] <= 1

    def test_score_grade_A(self, client, session_id):
        """final_score >= 0.8 → 등급 A"""
        res = client.post("/api/scores/", json={
            "session_id": session_id,
            "emotion_score": 0.9,
            "gaze_score": 0.9,
            "task_score": 0.9
        })
        assert res.json()["grade"] == "A"

    def test_score_grade_C(self, client, session_id):
        """final_score < 0.6 → 등급 C"""
        res = client.post("/api/scores/", json={
            "session_id": session_id,
            "emotion_score": 0.3,
            "gaze_score": 0.3,
            "task_score": 0.3
        })
        assert res.json()["grade"] == "C"

    def test_score_invalid_session(self, client):
        """존재하지 않는 session_id → 404"""
        res = client.post("/api/scores/", json={
            "session_id": 999999,
            "emotion_score": 0.5,
            "gaze_score": 0.5
        })
        assert res.status_code == 404


# ── 분석 조회 ────────────────────────────────────────────

class TestAnalytics:

    def test_user_analytics(self, client):
        """userId 기준 분석 데이터 조회"""
        res = client.get("/api/analytics/9001")
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == 9001
        assert "average_scores" in data
        assert "grade_distribution" in data

    def test_session_analytics(self, client, session_id):
        """세션별 상세 분석"""
        res = client.get(f"/api/session-analytics/{session_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["session_id"] == session_id
        assert "score_statistics" in data

    def test_analytics_nonexistent_session(self, client):
        """없는 세션 분석 → 404"""
        res = client.get("/api/session-analytics/999999")
        assert res.status_code == 404
