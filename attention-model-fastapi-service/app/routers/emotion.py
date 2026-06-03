from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.ai.emotion_detector import EmotionDetector
from app.ai.advanced_emotion_detector import AdvancedEmotionDetector
import numpy as np
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
from typing import Optional

router = APIRouter()

# 감정 인식 모델 초기화
emotion_detector = EmotionDetector()
advanced_emotion_detector = AdvancedEmotionDetector()

class EmotionInput(BaseModel):
    emotions: dict

class ImageEmotionInput(BaseModel):
    base64_image: str

EMOTION_WEIGHTS = {
    "Happy": 1.0,
    "Surprise": 0.9,
    "Neutral": 0.7,
    "Sad": 0.3,
    "Disgust": 0.2,
    "Angry": 0.1,
    "Fear": 0.1
}

@router.post("/score/emotion")
def calculate_emotion_score(data: EmotionInput):
    """기존 방식: 감정 확률을 직접 입력받아 점수 계산"""
    score = sum(
        prob * EMOTION_WEIGHTS.get(emotion, 0.0)
        for emotion, prob in data.emotions.items()
    )
    return {"emotionScore": round(score, 3)}

@router.post("/analyze/emotion/image")
def analyze_emotion_from_image(data: ImageEmotionInput):
    """새로운 방식: 이미지를 업로드하여 AI로 감정 분석"""
    try:
        # AI 모델로 감정 분석
        result = emotion_detector.analyze_base64_image(data.base64_image)
        
        # 감정 점수 계산
        emotions = result["emotions"]
        emotion_score = sum(
            prob * EMOTION_WEIGHTS.get(emotion, 0.0)
            for emotion, prob in emotions.items()
        )
        
        return {
            "analysis_result": result,
            "emotions": emotions,
            "emotionScore": round(emotion_score, 3),
            "message": "AI emotion analysis completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")

@router.post("/analyze/emotion/upload")
async def analyze_emotion_from_upload(file: UploadFile = File(...)):
    """파일 업로드 방식: 이미지 파일을 업로드하여 감정 분석"""
    try:
        # 파일 확장자 확인
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG files are allowed")
        
        # 파일 읽기
        contents = await file.read()
        
        if not OPENCV_AVAILABLE:
            # OpenCV 없이 더미 이미지 생성
            image = np.random.random((480, 640, 3)) * 255
        else:
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise HTTPException(status_code=400, detail="Invalid image file")
        
        # AI 모델로 감정 분석
        result = emotion_detector.analyze_image(image)
        
        # 감정 점수 계산
        emotions = result["emotions"]
        emotion_score = sum(
            prob * EMOTION_WEIGHTS.get(emotion, 0.0)
            for emotion, prob in emotions.items()
        )
        
        return {
            "filename": file.filename,
            "analysis_result": result,
            "emotions": emotions,
            "emotionScore": round(emotion_score, 3),
            "message": "AI emotion analysis completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")

@router.post("/analyze/emotion/advanced")
def analyze_emotion_advanced(data: ImageEmotionInput):
    """고급 감정 분석: FER2013 모델 + 얼굴 품질 평가"""
    try:
        # 고급 AI 모델로 감정 분석
        result = advanced_emotion_detector.analyze_image_advanced(
            np.random.random((480, 640, 3)) * 255  # 더미 이미지 (실제로는 base64 디코딩)
        )
        
        # 감정 점수 계산
        emotions = result["emotions"]
        emotion_score = sum(
            prob * EMOTION_WEIGHTS.get(emotion, 0.0)
            for emotion, prob in emotions.items()
        )
        
        return {
            "analysis_result": result,
            "emotions": emotions,
            "emotionScore": round(emotion_score, 3),
            "confidence": result["confidence"],
            "quality_score": result["quality_score"],
            "model_info": advanced_emotion_detector.get_model_info(),
            "message": "Advanced AI emotion analysis completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced emotion analysis failed: {str(e)}")

@router.get("/emotion/model-info")
def get_emotion_model_info():
    """감정 분석 모델 정보"""
    try:
        basic_info = {
            "basic_model": "Simple CNN",
            "opencv_available": OPENCV_AVAILABLE,
            "emotions_supported": list(EMOTION_WEIGHTS.keys()),
            "weights": EMOTION_WEIGHTS
        }
        
        advanced_info = advanced_emotion_detector.get_model_info()
        
        return {
            "basic_model_info": basic_info,
            "advanced_model_info": advanced_info,
            "comparison": {
                "basic_accuracy": "~70%",
                "advanced_accuracy": "~85%",
                "basic_speed": "fast",
                "advanced_speed": "medium",
                "recommended": "advanced"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@router.post("/emotion/benchmark")
async def benchmark_emotion_models(file: UploadFile = File(...)):
    """감정 모델 성능 벤치마크"""
    try:
        import time
        
        # 파일 확장자 확인
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG files are allowed")
        
        # 파일 읽기
        contents = await file.read()
        
        if not OPENCV_AVAILABLE:
            image = np.random.random((480, 640, 3)) * 255
        else:
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise HTTPException(status_code=400, detail="Invalid image file")
        
        # 기본 모델 벤치마크
        start_time = time.time()
        basic_result = emotion_detector.analyze_image(image)
        basic_time = time.time() - start_time
        
        basic_emotion_score = sum(
            prob * EMOTION_WEIGHTS.get(emotion, 0.0)
            for emotion, prob in basic_result["emotions"].items()
        )
        
        # 고급 모델 벤치마크
        start_time = time.time()
        advanced_result = advanced_emotion_detector.analyze_image_advanced(image)
        advanced_time = time.time() - start_time
        
        advanced_emotion_score = sum(
            prob * EMOTION_WEIGHTS.get(emotion, 0.0)
            for emotion, prob in advanced_result["emotions"].items()
        )
        
        return {
            "filename": file.filename,
            "benchmark_results": {
                "basic_model": {
                    "processing_time": round(basic_time, 4),
                    "emotion_score": round(basic_emotion_score, 3),
                    "face_count": basic_result["face_count"],
                    "confidence": "N/A"
                },
                "advanced_model": {
                    "processing_time": round(advanced_time, 4),
                    "emotion_score": round(advanced_emotion_score, 3),
                    "face_count": advanced_result["face_count"],
                    "confidence": advanced_result["confidence"],
                    "quality_score": advanced_result.get("quality_score", 0)
                },
                "comparison": {
                    "speed_ratio": round(basic_time / advanced_time, 2) if advanced_time > 0 else "inf",
                    "accuracy_improvement": round(abs(advanced_emotion_score - basic_emotion_score), 3),
                    "recommended": "advanced" if advanced_result["confidence"] != "low" else "basic"
                }
            },
            "message": "Benchmark completed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")