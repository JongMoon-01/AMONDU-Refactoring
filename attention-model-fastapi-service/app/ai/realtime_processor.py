import asyncio
import json
import base64
import io
import time
from typing import Dict, List, Optional, Callable
from collections import deque
import numpy as np

def convert_numpy(obj):
    if isinstance(obj, (np.integer, np.floating)):
        return obj.item()
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"{type(obj)} is not JSON serializable")

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

from app.ai.emotion_detector import EmotionDetector
from app.ai.gaze_tracker import GazeTracker
from app.ai.advanced_emotion_detector import AdvancedEmotionDetector
from app.ai.advanced_gaze_tracker import AdvancedGazeTracker

class RealtimeProcessor:
    def __init__(self, max_history: int = 30, use_advanced_models: bool = True):
        """실시간 비디오 처리기 초기화"""
        self.use_advanced_models = use_advanced_models
        
        if use_advanced_models:
            self.emotion_detector = AdvancedEmotionDetector()
            self.gaze_tracker = AdvancedGazeTracker()
            print("Using advanced AI models")
        else:
            self.emotion_detector = EmotionDetector()
            self.gaze_tracker = GazeTracker()
            print("Using basic AI models")
        
        # 프레임 히스토리 (최근 30프레임 저장)
        self.max_history = max_history
        self.emotion_history = deque(maxlen=max_history)
        self.gaze_history = deque(maxlen=max_history)
        self.frame_history = deque(maxlen=max_history)
        
        # 실시간 통계
        self.session_start_time = time.time()
        self.total_frames_processed = 0
        self.valid_emotion_frames = 0
        self.valid_gaze_frames = 0
        
        # 콜백 함수들
        self.on_frame_processed: Optional[Callable] = None
        self.on_score_updated: Optional[Callable] = None
        
        print("Realtime processor initialized")
    
    def process_frame(self, base64_image: str) -> Dict:
        """단일 프레임 처리"""
        try:
            frame_start_time = time.time()
            
            # 이미지 디코딩
            image_data = base64.b64decode(base64_image.split(',')[-1])
            
            if OPENCV_AVAILABLE:
                from PIL import Image
                image = Image.open(io.BytesIO(image_data))
                opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            else:
                opencv_image = np.random.random((480, 640, 3)) * 255
            
            # 감정 분석 (모델 타입에 따라 다른 메서드 사용)
            if self.use_advanced_models:
                emotion_result = self.emotion_detector.analyze_image_advanced(opencv_image)
            else:
                emotion_result = self.emotion_detector.analyze_image(opencv_image)
            
            # 시선 분석 (모델 타입에 따라 다른 메서드 사용)
            if self.use_advanced_models:
                gaze_result = self.gaze_tracker.analyze_gaze_advanced(opencv_image)
            else:
                gaze_result = self.gaze_tracker.detect_face_and_eyes(opencv_image)
            
            # 시선 점수 계산 (모델 타입에 따라 다른 방식)
            if self.use_advanced_models:
                # 고급 모델: attention_score 사용
                if gaze_result["face_detected"] and "attention_score" in gaze_result:
                    gaze_score = gaze_result["attention_score"]
                    self.valid_gaze_frames += 1
                else:
                    gaze_score = 0.0
            else:
                # 기본 모델: 기존 방식
                if gaze_result["face_detected"] and gaze_result.get("face_center") and gaze_result.get("eye_center"):
                    gaze_score = self.gaze_tracker.calculate_gaze_score(
                        gaze_result["face_center"], 
                        gaze_result["eye_center"]
                    )
                    self.valid_gaze_frames += 1
                else:
                    gaze_score = 0.0
            
            # 감정 점수 계산
            from app.routers.emotion import EMOTION_WEIGHTS
            emotion_score = sum(
                prob * EMOTION_WEIGHTS.get(emotion, 0.0)
                for emotion, prob in emotion_result["emotions"].items()
            )
            
            # 얼굴 검출 확인 (모델 타입에 따라 다른 방식)
            if self.use_advanced_models:
                if emotion_result["face_count"] > 0:
                    self.valid_emotion_frames += 1
            else:
                if emotion_result["face_count"] > 0:
                    self.valid_emotion_frames += 1
            
            # 프레임 정보 생성
            frame_info = {
                "timestamp": time.time(),
                "frame_id": self.total_frames_processed,
                "processing_time": time.time() - frame_start_time,
                "emotion_analysis": emotion_result,
                "gaze_analysis": gaze_result,
                "emotion_score": round(emotion_score, 3),
                "gaze_score": round(gaze_score, 3),
                "face_detected": emotion_result["face_count"] > 0 or gaze_result["face_detected"]
            }
            
            # 히스토리에 추가
            self.emotion_history.append(emotion_score)
            self.gaze_history.append(gaze_score)
            self.frame_history.append(frame_info)
            
            self.total_frames_processed += 1
            
            # 콜백 호출
            if self.on_frame_processed:
                self.on_frame_processed(frame_info)
            
            return json.loads(json.dumps(frame_info, default=convert_numpy))
            
        except Exception as e:
            print(f"Frame processing error: {e}")
            return {
                "timestamp": time.time(),
                "frame_id": self.total_frames_processed,
                "error": str(e),
                "emotion_score": 0.0,
                "gaze_score": 0.0,
                "face_detected": False
            }
    
    def get_realtime_scores(self) -> Dict:
        """실시간 점수 계산"""
        try:
            # 최근 프레임들의 평균 점수
            recent_emotion_scores = list(self.emotion_history)
            recent_gaze_scores = list(self.gaze_history)
            
            if not recent_emotion_scores or not recent_gaze_scores:
                return self._get_empty_scores()
            
            # 평균 점수 계산
            avg_emotion_score = sum(recent_emotion_scores) / len(recent_emotion_scores)
            avg_gaze_score = sum(recent_gaze_scores) / len(recent_gaze_scores)
            
            # TaskScore는 더미 데이터 (실제로는 퀴즈/클릭/발언 데이터가 필요)
            task_score = 0.7  # 더미 값
            
            # FinalScore 계산 (가중치: Emotion 0.4, Gaze 0.3, Task 0.3)
            final_score = 0.4 * avg_emotion_score + 0.3 * avg_gaze_score + 0.3 * task_score
            
            # 세션 통계
            session_duration = time.time() - self.session_start_time
            frame_rate = self.total_frames_processed / session_duration if session_duration > 0 else 0
            
            # 피드백 생성
            grade, message = self._generate_feedback(final_score)
            
            scores = {
                "realtime_scores": {
                    "emotion_score": round(avg_emotion_score, 3),
                    "gaze_score": round(avg_gaze_score, 3),
                    "task_score": round(task_score, 3),
                    "final_score": round(final_score, 3)
                },
                "session_stats": {
                    "total_frames": int(self.total_frames_processed),
                    "valid_emotion_frames": int(self.valid_emotion_frames),
                    "valid_gaze_frames": int(self.valid_gaze_frames),
                    "session_duration": round(float(session_duration), 1),
                    "frame_rate": round(float(frame_rate), 2),
                    "frames_in_history": int(len(self.frame_history))
                },
                "feedback": {
                    "grade": grade,
                    "message": message
                },
                "timestamp": float(time.time())
            }
            
            # 콜백 호출
            if self.on_score_updated:
                self.on_score_updated(scores)
            
            return json.loads(json.dumps(scores, default=convert_numpy))
            
        except Exception as e:
            print(f"Score calculation error: {e}")
            return json.loads(json.dumps(empty_scores, default=convert_numpy))
    
    def get_frame_history(self, last_n: int = 10) -> List[Dict]:
        """최근 N개 프레임 히스토리 반환"""
        frames = list(self.frame_history)
        return frames[-last_n:] if frames else []
    
    def reset_session(self):
        """세션 초기화"""
        self.emotion_history.clear()
        self.gaze_history.clear()
        self.frame_history.clear()
        
        self.session_start_time = time.time()
        self.total_frames_processed = 0
        self.valid_emotion_frames = 0
        self.valid_gaze_frames = 0
        
        print("Session reset")
    
    def get_session_summary(self) -> Dict:
        """세션 전체 요약"""
        if not self.frame_history:
            return {"message": "No frames processed in this session"}
        
        frames = list(self.frame_history)
        emotion_scores = [f["emotion_score"] for f in frames if "emotion_score" in f]
        gaze_scores = [f["gaze_score"] for f in frames if "gaze_score" in f]
        
        summary = {
            "session_summary": {
                "total_frames": len(frames),
                "avg_emotion_score": round(sum(emotion_scores) / len(emotion_scores), 3) if emotion_scores else 0,
                "avg_gaze_score": round(sum(gaze_scores) / len(gaze_scores), 3) if gaze_scores else 0,
                "max_emotion_score": round(max(emotion_scores), 3) if emotion_scores else 0,
                "max_gaze_score": round(max(gaze_scores), 3) if gaze_scores else 0,
                "min_emotion_score": round(min(emotion_scores), 3) if emotion_scores else 0,
                "min_gaze_score": round(min(gaze_scores), 3) if gaze_scores else 0,
                "session_duration": round(time.time() - self.session_start_time, 1),
                "face_detection_rate": round(self.valid_emotion_frames / self.total_frames_processed, 3) if self.total_frames_processed > 0 else 0
            }
        }
        return json.loads(json.dumps(summary, default=convert_numpy))
    
    def _generate_feedback(self, final_score: float) -> tuple:
        """점수에 따른 피드백 생성"""
        if final_score >= 0.8:
            return "A", "훌륭한 집중력이에요! 지금처럼 계속 유지해봐요."
        elif final_score >= 0.6:
            return "B", "집중도가 괜찮아요. 잠깐의 휴식도 고려해보세요."
        else:
            return "C", "집중력이 떨어지고 있어요. 자세를 고쳐보거나 쉬는 것도 좋아요."
    
    def _get_empty_scores(self) -> Dict:
        """빈 점수 딕셔너리 반환"""
        return {
            "realtime_scores": {
                "emotion_score": 0.0,
                "gaze_score": 0.0,
                "task_score": 0.0,
                "final_score": 0.0
            },
            "session_stats": {
                "total_frames": self.total_frames_processed,
                "valid_emotion_frames": self.valid_emotion_frames,
                "valid_gaze_frames": self.valid_gaze_frames,
                "session_duration": 0.0,
                "frame_rate": 0.0,
                "frames_in_history": 0
            },
            "feedback": {
                "grade": "C",
                "message": "데이터 부족으로 분석할 수 없습니다."
            },
            "timestamp": time.time()
        }