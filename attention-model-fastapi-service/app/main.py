from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import emotion, gaze, task, final, feedback, integrate, realtime, users, scores

app = FastAPI(
    title="AI 집중도 분석 API",
    description="실시간 감정 인식, 시선 추적, 집중도 분석 시스템",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 분석 라우터
app.include_router(emotion.router, prefix="/api/score", tags=["Emotion Analysis"])
app.include_router(gaze.router, prefix="/api/score", tags=["Gaze Tracking"])
app.include_router(task.router, prefix="/api/score", tags=["Task Analysis"])
app.include_router(final.router, prefix="/api/score", tags=["Final Score"])
app.include_router(feedback.router, prefix="/api/score", tags=["Feedback"])
app.include_router(integrate.router, prefix="/api/score", tags=["Integration"])
app.include_router(realtime.router, prefix="/api/score", tags=["Realtime Analysis"])

# 세션/통계 라우터 (JWT 기반 userId 사용)
app.include_router(users.router, prefix="/api", tags=["Session & Stats"])

# 점수 저장 및 분석 라우터
app.include_router(scores.router, prefix="/api", tags=["Score Management"])


@app.get("/")
def root():
    return {"message": "AI 집중도 분석 API 서버 동작 중", "version": "2.1.0"}
