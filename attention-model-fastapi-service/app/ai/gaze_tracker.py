import numpy as np
import base64
import io
from typing import Dict, List, Tuple
import json

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    print("OpenCV not available for gaze tracking, using dummy data")

class GazeTracker:
    def __init__(self):
        """시선 추적 모델 초기화"""
        if OPENCV_AVAILABLE:
            # 얼굴 검출기
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            # 눈 검출기
            self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
            print("OpenCV gaze tracker initialized")
        else:
            self.face_cascade = None
            self.eye_cascade = None
            print("Using dummy gaze tracker")
    
    def detect_face_and_eyes(self, image: np.ndarray) -> Dict:
        """얼굴과 눈을 검출하여 중심점 계산"""
        if not OPENCV_AVAILABLE:
            return self._get_dummy_gaze_data()
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 얼굴 검출
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) == 0:
                return {
                    "face_detected": False,
                    "face_center": None,
                    "eye_center": None,
                    "message": "No face detected"
                }
            
            # 가장 큰 얼굴 선택
            largest_face = max(faces, key=lambda face: face[2] * face[3])
            fx, fy, fw, fh = largest_face
            
            # 얼굴 중심점 계산
            face_center_x = fx + fw // 2
            face_center_y = fy + fh // 2
            
            # 얼굴 영역에서 눈 검출
            roi_gray = gray[fy:fy+fh, fx:fx+fw]
            eyes = self.eye_cascade.detectMultiScale(roi_gray, 1.1, 5)
            
            if len(eyes) == 0:
                return {
                    "face_detected": True,
                    "face_center": (face_center_x, face_center_y),
                    "eye_center": None,
                    "face_box": (fx, fy, fw, fh),
                    "message": "Face detected but no eyes found"
                }
            
            # 눈 중심점 계산 (여러 눈이 검출된 경우 평균)
            eye_centers = []
            for (ex, ey, ew, eh) in eyes:
                # 얼굴 좌표계에서 전체 이미지 좌표계로 변환
                absolute_ex = fx + ex + ew // 2
                absolute_ey = fy + ey + eh // 2
                eye_centers.append((absolute_ex, absolute_ey))
            
            # 평균 눈 중심점
            avg_eye_x = sum(eye[0] for eye in eye_centers) // len(eye_centers)
            avg_eye_y = sum(eye[1] for eye in eye_centers) // len(eye_centers)
            
            return {
                "face_detected": True,
                "face_center": (face_center_x, face_center_y),
                "eye_center": (avg_eye_x, avg_eye_y),
                "face_box": (fx, fy, fw, fh),
                "eye_boxes": eyes.tolist(),
                "eye_count": len(eyes),
                "message": f"Face and {len(eyes)} eyes detected"
            }
            
        except Exception as e:
            print(f"Gaze detection error: {e}")
            return {
                "face_detected": False,
                "face_center": None,
                "eye_center": None,
                "message": f"Detection error: {e}"
            }
    
    def calculate_gaze_score(self, face_center: Tuple[int, int], eye_center: Tuple[int, int], threshold: float = 30.0) -> float:
        """얼굴 중심점과 눈 중심점 사이의 거리로 정면 응시 점수 계산"""
        if face_center is None or eye_center is None:
            return 0.0
        
        # 유클리드 거리 계산
        distance = np.sqrt((face_center[0] - eye_center[0])**2 + (face_center[1] - eye_center[1])**2)
        
        # 임계값보다 작으면 정면 응시로 판단
        if distance < threshold:
            # 거리가 가까울수록 높은 점수 (최대 1.0)
            score = max(0.0, 1.0 - (distance / threshold))
        else:
            score = 0.0
        
        return score
    
    def analyze_gaze_from_frames(self, frames_data: List[Dict]) -> Dict:
        """여러 프레임의 시선 데이터를 분석"""
        if not frames_data:
            return {
                "total_frames": 0,
                "gaze_frames": 0,
                "gaze_score": 0.0,
                "average_distance": 0.0,
                "message": "No frames provided"
            }
        
        gaze_scores = []
        distances = []
        
        for frame in frames_data:
            face_center = frame.get("face_center")
            eye_center = frame.get("eye_center")
            threshold = frame.get("threshold", 30.0)
            
            # 튜플이 아닌 경우 변환
            if isinstance(face_center, list):
                face_center = tuple(face_center)
            if isinstance(eye_center, list):
                eye_center = tuple(eye_center)
            
            score = self.calculate_gaze_score(face_center, eye_center, threshold)
            gaze_scores.append(score)
            
            if face_center and eye_center:
                distance = np.sqrt((face_center[0] - eye_center[0])**2 + (face_center[1] - eye_center[1])**2)
                distances.append(distance)
        
        # 통계 계산
        total_frames = len(frames_data)
        gaze_frames = sum(1 for score in gaze_scores if score > 0.5)  # 50% 이상 정면 응시
        overall_gaze_score = sum(gaze_scores) / total_frames if total_frames > 0 else 0.0
        average_distance = sum(distances) / len(distances) if distances else 0.0
        
        return {
            "total_frames": total_frames,
            "gaze_frames": gaze_frames,
            "gaze_score": round(overall_gaze_score, 3),
            "average_distance": round(average_distance, 2),
            "gaze_ratio": round(gaze_frames / total_frames, 3) if total_frames > 0 else 0.0,
            "message": f"Analyzed {total_frames} frames, {gaze_frames} with good gaze"
        }
    
    def analyze_base64_image(self, base64_str: str) -> Dict:
        """Base64 이미지에서 시선 분석"""
        try:
            # Base64 디코딩
            image_data = base64.b64decode(base64_str.split(',')[-1])
            
            if OPENCV_AVAILABLE:
                from PIL import Image
                image = Image.open(io.BytesIO(image_data))
                opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                return self.detect_face_and_eyes(opencv_image)
            else:
                return self._get_dummy_gaze_data()
                
        except Exception as e:
            print(f"Base64 gaze analysis error: {e}")
            return {
                "face_detected": False,
                "face_center": None,
                "eye_center": None,
                "message": f"Error processing image: {e}"
            }
    
    def _get_dummy_gaze_data(self) -> Dict:
        """더미 시선 데이터 (OpenCV 없을 때 사용)"""
        import random
        
        # 랜덤하게 얼굴과 눈 중심점 생성
        face_x, face_y = random.randint(200, 400), random.randint(150, 300)
        
        # 눈은 얼굴 근처에 위치 (정면 응시 시뮬레이션)
        is_looking = random.random() > 0.3  # 70% 확률로 정면 응시
        
        if is_looking:
            # 정면 응시: 눈이 얼굴 중심 근처
            eye_x = face_x + random.randint(-15, 15)
            eye_y = face_y + random.randint(-15, 15)
        else:
            # 시선 분산: 눈이 얼굴에서 멀리
            eye_x = face_x + random.randint(-50, 50)
            eye_y = face_y + random.randint(-50, 50)
        
        return {
            "face_detected": True,
            "face_center": (face_x, face_y),
            "eye_center": (eye_x, eye_y),
            "face_box": (face_x-50, face_y-60, 100, 120),
            "eye_boxes": [[eye_x-10, eye_y-5, 20, 10]],
            "eye_count": 1,
            "message": "Dummy gaze data (OpenCV not available)"
        }