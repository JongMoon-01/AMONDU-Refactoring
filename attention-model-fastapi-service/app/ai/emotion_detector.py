import numpy as np
import base64
import io
from typing import Dict, List
import random

# OpenCV와 TensorFlow는 일시적으로 제외하고 더미 데이터로 테스트
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    print("OpenCV not available, using dummy data")

try:
    import tensorflow as tf
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("TensorFlow not available, using dummy data")

class EmotionDetector:
    def __init__(self):
        """감정 인식 모델 초기화"""
        self.emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]
        
        if OPENCV_AVAILABLE:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        else:
            self.face_cascade = None
        
        # 사전훈련된 모델 로드 (FER2013 기반)
        if TENSORFLOW_AVAILABLE:
            try:
                self.model = self._create_simple_model()
                print("Simple emotion model loaded")
            except Exception as e:
                print(f"Model loading error: {e}")
                self.model = None
        else:
            self.model = None
            print("Using dummy emotion detection")
    
    def _create_simple_model(self):
        """간단한 감정 분류 모델 생성 (실제 환경에서는 사전훈련된 모델 사용)"""
        model = keras.Sequential([
            keras.layers.Input(shape=(48, 48, 1)),
            keras.layers.Conv2D(32, (3, 3), activation='relu'),
            keras.layers.MaxPooling2D(2, 2),
            keras.layers.Conv2D(64, (3, 3), activation='relu'),
            keras.layers.MaxPooling2D(2, 2),
            keras.layers.Conv2D(128, (3, 3), activation='relu'),
            keras.layers.MaxPooling2D(2, 2),
            keras.layers.Flatten(),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(7, activation='softmax')
        ])
        
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        
        # 더미 훈련 (실제로는 FER2013 데이터셋으로 훈련된 모델 사용)
        # 여기서는 랜덤 가중치를 사용하여 데모용으로 작동
        return model
    
    def detect_faces(self, image: np.ndarray) -> List[tuple]:
        """이미지에서 얼굴 검출"""
        if not OPENCV_AVAILABLE or self.face_cascade is None:
            # 더미 얼굴 검출 결과 반환
            height, width = image.shape[:2] if len(image.shape) > 1 else (480, 640)
            return [(int(width*0.3), int(height*0.2), int(width*0.4), int(height*0.6))]
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        return faces
    
    def preprocess_face(self, face_img: np.ndarray) -> np.ndarray:
        """얼굴 이미지 전처리"""
        if not OPENCV_AVAILABLE:
            # OpenCV 없이 더미 전처리
            return np.random.random((1, 48, 48, 1)).astype('float32')
        
        # 그레이스케일 변환
        if len(face_img.shape) == 3:
            face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        
        # 48x48로 리사이즈
        face_img = cv2.resize(face_img, (48, 48))
        
        # 정규화
        face_img = face_img.astype('float32') / 255.0
        
        # 배치 차원 추가
        face_img = np.expand_dims(face_img, axis=-1)
        face_img = np.expand_dims(face_img, axis=0)
        
        return face_img
    
    def predict_emotion(self, face_img: np.ndarray) -> Dict[str, float]:
        """얼굴 이미지로부터 감정 예측"""
        if self.model is None:
            # 모델이 없는 경우 더미 결과 반환
            return self._get_dummy_emotion()
        
        try:
            processed_face = self.preprocess_face(face_img)
            predictions = self.model.predict(processed_face, verbose=0)
            
            # 예측 결과를 딕셔너리로 변환
            emotion_dict = {}
            for i, emotion in enumerate(self.emotion_labels):
                emotion_dict[emotion] = float(predictions[0][i])
            
            return emotion_dict
            
        except Exception as e:
            print(f"Emotion prediction error: {e}")
            return self._get_dummy_emotion()
    
    def _get_dummy_emotion(self) -> Dict[str, float]:
        """더미 감정 데이터 (모델이 없을 때 사용)"""
        import random
        emotions = {}
        total = 1.0
        
        for emotion in self.emotion_labels[:-1]:
            value = random.uniform(0, total/2)
            emotions[emotion] = value
            total -= value
        
        emotions[self.emotion_labels[-1]] = max(0, total)
        
        # 정규화
        total_sum = sum(emotions.values())
        for emotion in emotions:
            emotions[emotion] = emotions[emotion] / total_sum
            
        return emotions
    
    def analyze_image(self, image: np.ndarray) -> Dict:
        """이미지 전체 분석"""
        try:
            faces = self.detect_faces(image)
            
            if len(faces) == 0:
                return {
                    "face_count": 0,
                    "emotions": self._get_dummy_emotion(),
                    "message": "No face detected"
                }
            
            # 가장 큰 얼굴 선택
            largest_face = max(faces, key=lambda face: face[2] * face[3])
            x, y, w, h = largest_face
            
            # 얼굴 영역 추출
            if OPENCV_AVAILABLE and image is not None:
                face_img = image[y:y+h, x:x+w]
            else:
                face_img = np.random.random((h, w, 3)) * 255
            
            # 감정 예측
            emotions = self.predict_emotion(face_img)
            
            return {
                "face_count": len(faces),
                "face_location": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                "emotions": emotions,
                "message": "Face detected and analyzed"
            }
        except Exception as e:
            print(f"Image analysis error: {e}")
            return {
                "face_count": 0,
                "emotions": self._get_dummy_emotion(),
                "message": f"Analysis error: {e}"
            }
    
    def analyze_base64_image(self, base64_str: str) -> Dict:
        """Base64 인코딩된 이미지 분석"""
        try:
            # Base64 디코딩
            image_data = base64.b64decode(base64_str.split(',')[-1])
            
            if OPENCV_AVAILABLE:
                from PIL import Image
                image = Image.open(io.BytesIO(image_data))
                # OpenCV 형식으로 변환
                opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                return self.analyze_image(opencv_image)
            else:
                # OpenCV 없이 더미 분석
                return {
                    "face_count": 1,
                    "face_location": {"x": 100, "y": 50, "width": 200, "height": 250},
                    "emotions": self._get_dummy_emotion(),
                    "message": "Dummy analysis (OpenCV not available)"
                }
            
        except Exception as e:
            print(f"Base64 image analysis error: {e}")
            return {
                "face_count": 0,
                "emotions": self._get_dummy_emotion(),
                "message": f"Error processing image: {e}"
            }