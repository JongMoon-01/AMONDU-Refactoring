from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Dict, List
import json
import asyncio
from app.ai.realtime_processor import RealtimeProcessor

router = APIRouter()

# WebSocket 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.processors: Dict[str, RealtimeProcessor] = {}

    async def connect(self, websocket: WebSocket, client_id: str, use_advanced: bool = True):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.processors[client_id] = RealtimeProcessor(use_advanced_models=use_advanced)
        print(f"Client {client_id} connected with {'advanced' if use_advanced else 'basic'} models")

    def disconnect(self, websocket: WebSocket, client_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if client_id in self.processors:
            del self.processors[client_id]
        print(f"Client {client_id} disconnected")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

# 요청 모델 정의
class RealtimeFrameInput(BaseModel):
    base64_image: str
    timestamp: float

# REST API: 단일 이미지 분석용 엔드포인트
@router.post("/realtime/image")
async def process_single_image(data: RealtimeFrameInput, use_advanced: bool = True):
    try:
        processor = RealtimeProcessor(use_advanced_models=use_advanced)
        processor.process_frame(data.base64_image)
        scores = processor.get_realtime_scores()
        return {
            "emotion_score": scores["realtime_scores"]["emotion_score"],
            "gaze_score": scores["realtime_scores"]["gaze_score"],
            "final_score": scores["realtime_scores"]["final_score"],
            "grade": scores["feedback"]["grade"],
            "message": "Frame processed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

# WebSocket: 실시간 분석 처리
@router.websocket("/ws/realtime/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    processor = manager.processors[client_id]
    try:
        await manager.send_personal_message(json.dumps({
            "type": "connection_established",
            "client_id": client_id,
            "message": "실시간 분석 연결 성공"
        }), websocket)

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "frame":
                processor.process_frame(message["base64_image"])
                scores = processor.get_realtime_scores()
                response = {
                    "type": "analysis_result",
                    "realtime_scores": scores,
                    "client_id": client_id
                }
                await manager.send_personal_message(json.dumps(response), websocket)

            elif message["type"] == "get_scores":
                scores = processor.get_realtime_scores()
                response = {
                    "type": "current_scores",
                    "scores": scores,
                    "client_id": client_id
                }
                await manager.send_personal_message(json.dumps(response), websocket)

            elif message["type"] == "reset_session":
                processor.reset_session()
                response = {
                    "type": "session_reset",
                    "message": "세션이 초기화되었습니다",
                    "client_id": client_id
                }
                await manager.send_personal_message(json.dumps(response), websocket)

            elif message["type"] == "get_summary":
                summary = processor.get_session_summary()
                response = {
                    "type": "session_summary",
                    "summary": summary,
                    "client_id": client_id
                }
                await manager.send_personal_message(json.dumps(response), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, client_id)

# 상태 확인용 엔드포인트
@router.get("/realtime/status")
async def get_realtime_status():
    return {
        "active_connections": len(manager.active_connections),
        "active_processors": len(manager.processors),
        "message": "Realtime processing service is running"
    }
