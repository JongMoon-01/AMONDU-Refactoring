from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ✅ CORS 모듈 추가
from .api.endpoints import router
from dotenv import load_dotenv

load_dotenv()  # ✅ .env 환경변수 로드

app = FastAPI()

# ✅ CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 라우터 등록
app.include_router(router)

# ✅ 앱 직접 실행 (uvicorn으로 실행 가능하게)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8082, reload=True)

