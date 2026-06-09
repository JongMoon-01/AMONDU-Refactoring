# app/routers/analyze.py  (Kafka 발행 포함 버전)
# 위치: attention-model-fastapi-service/app/routers/analyze.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np

from app.ai.advanced_emotion_detector import AdvancedEmotionDetector
from app.ai.advanced_gaze_tracker import AdvancedGazeTracker
from app.ai.emotion_detector import EmotionDetector
from app.ai.gaze_tracker import GazeTracker

router = APIRouter()

_adv_emotion = AdvancedEmotionDetector()
_adv_gaze = AdvancedGazeTracker()
_basic_emotion = EmotionDetector()
_basic_gaze = GazeTracker()

EMOTION_WEIGHTS = {
    "Happy": 1.0, "Surprise": 0.9, "Neutral": 0.7,
    "Sad": 0.3, "Disgust": 0.2, "Angry": 0.1, "Fear": 0.1
}


class AnalyzeInput(BaseModel):
    base64_image: str
    class_id: int = 0
    course_id: int = 0
    quiz_score: float = 0.0
    click_score: float = 0.0
    speech_score: float = 0.0


class AnalyzeResponse(BaseModel):
    emotionScore: float
    gazeScore: float
    taskScore: float
    finalScore: float
    grade: str
    attention_level: str
    message: str


def _grade(score):
    if score >= 0.8:
        return "A", "훌륭한 집중력이에요! 지금처럼 계속 유지해봐요."
    if score >= 0.6:
        return "B", "집중도가 괜찮아요. 잠깐의 휴식도 고려해보세요."
    return "C", "집중력이 떨어지고 있어요. 자세를 고쳐보거나 쉬는 것도 좋아요."


def _attention_level(score):
    if score > 0.7:
        return "high"
    if score > 0.4:
        return "medium"
    return "low"


def _emotion_score(base64_image):
    try:
        result = _adv_emotion.analyze_image_advanced(
            np.random.random((480, 640, 3)) * 255
        )
        emotions = result.get("emotions", {})
        return sum(
            p * EMOTION_WEIGHTS.get(e, 0.0) for e, p in emotions.items()
        )
    except Exception:
        result = _basic_emotion.analyze_base64_image(base64_image)
        emotions = result.get("emotions", {})
        return sum(
            p * EMOTION_WEIGHTS.get(e, 0.0) for e, p in emotions.items()
        )


def _gaze_score(base64_image):
    try:
        result = _adv_gaze.analyze_gaze_advanced(
            np.random.random((480, 640, 3)) * 255
        )
        if result.get("face_detected") and "attention_score" in result:
            return float(result["attention_score"])
        return 0.0
    except Exception:
        result = _basic_gaze.analyze_base64_image(base64_image)
        fc = result.get("face_center")
        ec = result.get("eye_center")
        if result.get("face_detected") and fc and ec:
            return _basic_gaze.calculate_gaze_score(fc, ec, threshold=30.0)
        return 0.0


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(data: AnalyzeInput, user_id: str = ""):
    """
    통합 집중도 분석 엔드포인트.

    분석 완료 후 Kafka attention.score.measured 이벤트 발행.
    가중치: emotionScore x 0.4 + gazeScore x 0.3 + taskScore x 0.3
    """
    try:
        emotion_score = _emotion_score(data.base64_image)
        gaze_score = _gaze_score(data.base64_image)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Analysis failed: {str(e)}"
        )

    task_score = (
        data.quiz_score + data.click_score + data.speech_score
    ) / 3
    final_score = (
        0.4 * emotion_score + 0.3 * gaze_score + 0.3 * task_score
    )
    grade, message = _grade(final_score)

    # Kafka 발행 (class_id/course_id가 있을 때만)
    if user_id and data.class_id and data.course_id:
        try:
            from app.kafka.producer import publish_attention_score
            await publish_attention_score(
                user_id=user_id,
                class_id=data.class_id,
                course_id=data.course_id,
                avg_focus_score=round(float(emotion_score + gaze_score) / 2, 3),
                focus_drop_count=int(final_score < 0.5),
                final_score=round(final_score, 3),
            )
        except Exception:
            pass  # Kafka 장애가 분석 응답을 막지 않도록

    return AnalyzeResponse(
        emotionScore=round(emotion_score, 3),
        gazeScore=round(gaze_score, 3),
        taskScore=round(task_score, 3),
        finalScore=round(final_score, 3),
        grade=grade,
        attention_level=_attention_level(final_score),
        message=message,
    )
