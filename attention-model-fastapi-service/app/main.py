from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import emotion, gaze, task, final, feedback, integrate, realtime, users, scores

app = FastAPI(
    title="AI 집중도 분석 API",
    description="실시간 감정 인식, 시선 추적, 집중도 분석 시스템",
    version="2.0.0"
)

# CORS 설정 - HTML에서 API 접근 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메소드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 기존 라우터 등록
app.include_router(emotion.router, prefix="/api/score", tags=["Emotion Analysis"])
app.include_router(gaze.router, prefix="/api/score", tags=["Gaze Tracking"])
app.include_router(task.router, prefix="/api/score", tags=["Task Analysis"])  
app.include_router(final.router, prefix="/api/score", tags=["Final Score"])
app.include_router(feedback.router, prefix="/api/score", tags=["Feedback"])
app.include_router(integrate.router, prefix="/api/score", tags=["Integration"])

# 실시간 분석 라우터 추가
app.include_router(realtime.router, prefix="/api/score", tags=["Realtime Analysis"])

# 사용자 및 세션 관리 라우터 추가
app.include_router(users.router, prefix="/api", tags=["User Management"])

# 점수 저장 및 분석 라우터 추가
app.include_router(scores.router, prefix="/api", tags=["Score Management"])

@app.get("/")
def root():
    return {"message": "AI 집중도 분석 API 서버 동작 중"}