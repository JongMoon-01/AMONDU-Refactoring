from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class FullInput(BaseModel):
    emotions: dict
    gaze: list
    quiz_score: float
    click_score: float
    speech_score: float

EMOTION_WEIGHTS = {
    "Happy": 1.0,
    "Surprise": 0.9,
    "Neutral": 0.7,
    "Sad": 0.3,
    "Disgust": 0.2,
    "Angry": 0.1,
    "Fear": 0.1
}

@router.post("/integrate")
def full_analysis(data: FullInput):
    emotion_score = sum(
        prob * EMOTION_WEIGHTS.get(emotion, 0.0)
        for emotion, prob in data.emotions.items()
    )
    gaze_frames = sum(
        abs(frame["face_center"] - frame["eye_center"]) < 30.0
        for frame in data.gaze
    )
    gaze_score = gaze_frames / len(data.gaze) if data.gaze else 0.0
    task_score = (data.quiz_score + data.click_score + data.speech_score) / 3
    final_score = 0.4 * emotion_score + 0.3 * gaze_score + 0.3 * task_score

    if final_score >= 0.8:
        grade = "A"
        message = "훌륭한 집중력이에요! 지금처럼 계속 유지해봐요."
    elif final_score >= 0.6:
        grade = "B"
        message = "집중도가 괜찮아요. 잠깐의 휴식도 고려해보세요."
    else:
        grade = "C"
        message = "집중력이 떨어지고 있어요. 자세를 고쳐보거나 쉬는 것도 좋아요."

    return {
        "emotionScore": round(emotion_score, 3),
        "gazeScore": round(gaze_score, 3),
        "taskScore": round(task_score, 3),
        "finalScore": round(final_score, 3),
        "grade": grade,
        "message": message
    }