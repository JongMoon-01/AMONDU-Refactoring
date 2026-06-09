# app/main.py  (Prometheus metrics 추가)
from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers import analyze, realtime, users, scores
from app.kafka.producer import stop_producer
from app.kafka.consumer import start_enrollment_consumer


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer_task = asyncio.create_task(start_enrollment_consumer())
    yield
    consumer_task.cancel()
    await stop_producer()


app = FastAPI(
    title="AI 집중도 분석 API",
    description="실시간 감정 인식, 시선 추적, 집중도 분석 시스템",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⑥ Prometheus /metrics 자동 노출
Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
).instrument(app).expose(app, endpoint="/metrics")

app.include_router(analyze.router, prefix="/api", tags=["Analyze"])
app.include_router(realtime.router, prefix="/api", tags=["Realtime"])
app.include_router(users.router, prefix="/api", tags=["Session & Stats"])
app.include_router(scores.router, prefix="/api", tags=["Score Management"])


@app.get("/")
def root():
    return {"message": "AI 집중도 분석 API 서버 동작 중", "version": "3.0.0"}
