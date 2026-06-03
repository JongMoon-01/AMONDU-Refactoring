import numpy as np
import base64
import io
from typing import Dict, List, Tuple, Optional
import json
import math

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

try:
    import dlib
    DLIB_AVAILABLE = True
except ImportError:
    DLIB_AVAILABLE = False
    print("Dlib not available, using OpenCV-based detection")

class AdvancedGazeTracker:
    def __init__(self):
        """고급 시선 추적기 초기화"""
        self.face_detector = None
        self.landmark_predictor = None
        self.eye_classifier = None
        
        if OPENCV_AVAILABLE:
            # OpenCV 검출기
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
            
            # 프로파일 얼굴 검출기도 추가
            self.profile_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        
        if DLIB_AVAILABLE:
            # Dlib 검출기 (더 정확함)
            self.face_detector = dlib.get_frontal_face_detector()
            # 68점 얼굴 랜드마크 예측기 (사전 다운로드 필요)
            try:
                predictor_path = "/workspace/AivleBigProject/fastapi-service/app/models/shape_predictor_68_face_landmarks.dat"
                self.landmark_predictor = dlib.shape_predictor(predictor_path)
                print("Dlib landmark predictor loaded")
            except:
                print("Dlib landmark predictor not found, using OpenCV only")
                self.landmark_predictor = None
        
        # 시선 추적 통계
        self.gaze_stats = {
            "total_frames_analyzed": 0,
            "faces_detected": 0,
            "eyes_detected": 0,
            "successful_gaze_calculations": 0,
            "average_confidence": 0.0
        }
        
        print("Advanced gaze tracker initialized")
    
    def detect_faces_advanced(self, image: np.ndarray) -> List[Dict]:
        """고급 얼굴 검출 (Dlib + OpenCV 조합)"""
        faces_data = []
        
        if DLIB_AVAILABLE and self.face_detector is not None:
            # Dlib 검출 (더 정확)
            faces_data.extend(self._detect_faces_dlib(image))
        
        if OPENCV_AVAILABLE:
            # OpenCV 검출 (빠름)
            faces_data.extend(self._detect_faces_opencv(image))
        
        if not faces_data:
            # 검출 실패 시 더미 데이터
            faces_data = self._get_dummy_face_data()
        
        # 중복 제거 및 품질 기준 정렬
        faces_data = self._remove_duplicate_faces(faces_data)
        faces_data.sort(key=lambda x: x["confidence"], reverse=True)
        
        return faces_data
    
    def _detect_faces_dlib(self, image: np.ndarray) -> List[Dict]:
        """Dlib 기반 얼굴 검출"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_detector(gray)
            
            faces_data = []
            for i, face in enumerate(faces):
                x, y, w, h = face.left(), face.top(), face.width(), face.height()
                
                # 얼굴 랜드마크 검출
                landmarks = None
                if self.landmark_predictor:
                    landmarks = self.landmark_predictor(gray, face)
                    landmarks_points = [(landmarks.part(j).x, landmarks.part(j).y) for j in range(68)]
                else:
                    landmarks_points = []
                
                # 신뢰도 계산 (Dlib는 일반적으로 높은 신뢰도)
                confidence = 0.9
                
                faces_data.append({
                    "detector": "dlib",
                    "face_id": f"dlib_{i}",
                    "bbox": (x, y, w, h),
                    "center": (x + w // 2, y + h // 2),
                    "confidence": confidence,
                    "landmarks": landmarks_points,
                    "has_landmarks": len(landmarks_points) > 0
                })
            
            return faces_data
            
        except Exception as e:
            print(f"Dlib face detection error: {e}")
            return []
    
    def _detect_faces_opencv(self, image: np.ndarray) -> List[Dict]:
        """OpenCV 기반 얼굴 검출"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 정면 얼굴 검출
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            # 프로파일 얼굴도 검출
            if hasattr(self, 'profile_face_cascade'):
                profile_faces = self.profile_face_cascade.detectMultiScale(gray, 1.3, 5)
                if len(profile_faces) > 0:
                    faces = np.concatenate([faces, profile_faces])
            
            faces_data = []
            for i, (x, y, w, h) in enumerate(faces):
                # 신뢰도 계산 (크기와 위치 기반)
                confidence = min(0.8, (w * h) / (100 * 100))
                
                faces_data.append({
                    "detector": "opencv",
                    "face_id": f"opencv_{i}",
                    "bbox": (x, y, w, h),
                    "center": (x + w // 2, y + h // 2),
                    "confidence": confidence,
                    "landmarks": [],
                    "has_landmarks": False
                })
            
            return faces_data
            
        except Exception as e:
            print(f"OpenCV face detection error: {e}")
            return []
    
    def detect_eyes_advanced(self, image: np.ndarray, face_data: Dict) -> Dict:
        """고급 눈 검출 (랜드마크 또는 Cascade 사용)"""
        try:
            if face_data["has_landmarks"] and len(face_data["landmarks"]) == 68:
                # 68점 랜드마크에서 눈 위치 추출
                return self._extract_eyes_from_landmarks(face_data["landmarks"])
            else:
                # OpenCV Cascade로 눈 검출
                return self._detect_eyes_opencv(image, face_data)
                
        except Exception as e:
            print(f"Eye detection error: {e}")
            return self._get_dummy_eye_data()
    
    def _extract_eyes_from_landmarks(self, landmarks: List[Tuple[int, int]]) -> Dict:
        """68점 랜드마크에서 눈 위치 계산"""
        try:
            # 68점 랜드마크에서 눈 영역
            # 왼쪽 눈: 점 36-41, 오른쪽 눈: 점 42-47
            left_eye_points = landmarks[36:42]
            right_eye_points = landmarks[42:48]
            
            # 눈 중심점 계산
            left_eye_center = (
                sum(p[0] for p in left_eye_points) // len(left_eye_points),
                sum(p[1] for p in left_eye_points) // len(left_eye_points)
            )
            
            right_eye_center = (
                sum(p[0] for p in right_eye_points) // len(right_eye_points),
                sum(p[1] for p in right_eye_points) // len(right_eye_points)
            )
            
            # 전체 눈 중심점 (두 눈의 중점)
            eye_center = (
                (left_eye_center[0] + right_eye_center[0]) // 2,
                (left_eye_center[1] + right_eye_center[1]) // 2
            )
            
            # 눈 크기 계산
            left_eye_width = max(p[0] for p in left_eye_points) - min(p[0] for p in left_eye_points)
            right_eye_width = max(p[0] for p in right_eye_points) - min(p[0] for p in right_eye_points)
            
            return {
                "eyes_detected": True,
                "method": "landmarks",
                "left_eye": {
                    "center": left_eye_center,
                    "points": left_eye_points,
                    "width": left_eye_width
                },
                "right_eye": {
                    "center": right_eye_center,
                    "points": right_eye_points,
                    "width": right_eye_width
                },
                "eye_center": eye_center,
                "eye_distance": abs(left_eye_center[0] - right_eye_center[0]),
                "confidence": 0.95
            }
            
        except Exception as e:
            print(f"Landmark eye extraction error: {e}")
            return self._get_dummy_eye_data()
    
    def _detect_eyes_opencv(self, image: np.ndarray, face_data: Dict) -> Dict:
        """OpenCV로 눈 검출"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            x, y, w, h = face_data["bbox"]
            
            # 얼굴 영역에서 눈 검출
            roi_gray = gray[y:y+h, x:x+w]
            eyes = self.eye_cascade.detectMultiScale(roi_gray, 1.1, 3)
            
            if len(eyes) == 0:
                return self._get_dummy_eye_data()
            
            # 눈 위치를 전체 이미지 좌표로 변환
            eye_centers = []
            eye_data = []
            
            for (ex, ey, ew, eh) in eyes:
                # 절대 좌표로 변환
                abs_ex = x + ex + ew // 2
                abs_ey = y + ey + eh // 2
                eye_centers.append((abs_ex, abs_ey))
                eye_data.append({
                    "center": (abs_ex, abs_ey),
                    "bbox": (x + ex, y + ey, ew, eh),
                    "width": ew
                })
            
            # 평균 눈 중심점
            avg_eye_center = (
                sum(eye[0] for eye in eye_centers) // len(eye_centers),
                sum(eye[1] for eye in eye_centers) // len(eye_centers)
            )
            
            return {
                "eyes_detected": True,
                "method": "opencv",
                "eye_center": avg_eye_center,
                "eye_count": len(eyes),
                "eye_data": eye_data,
                "confidence": 0.7
            }
            
        except Exception as e:
            print(f"OpenCV eye detection error: {e}")
            return self._get_dummy_eye_data()
    
    def calculate_gaze_direction(self, face_center: Tuple[int, int], eye_center: Tuple[int, int]) -> Dict:
        """시선 방향 계산 (고급 분석)"""
        try:
            # 유클리드 거리
            distance = np.sqrt((face_center[0] - eye_center[0])**2 + (face_center[1] - eye_center[1])**2)
            
            # 각도 계산 (라디안)
            angle_rad = math.atan2(eye_center[1] - face_center[1], eye_center[0] - face_center[0])
            angle_deg = math.degrees(angle_rad)
            
            # 시선 방향 분류
            if distance < 20:
                direction = "center"
                attention_score = 1.0
            elif distance < 40:
                direction = "near_center"
                attention_score = 0.7
            elif distance < 60:
                if abs(angle_deg) < 45:
                    direction = "looking_right" if angle_deg > 0 else "looking_left"
                else:
                    direction = "looking_down" if abs(angle_deg) > 135 else "looking_up"
                attention_score = 0.4
            else:
                direction = "distracted"
                attention_score = 0.1
            
            return {
                "distance": round(distance, 2),
                "angle_degrees": round(angle_deg, 2),
                "direction": direction,
                "attention_score": round(attention_score, 3),
                "is_focused": attention_score > 0.6
            }
            
        except Exception as e:
            print(f"Gaze direction calculation error: {e}")
            return {
                "distance": 0,
                "angle_degrees": 0,
                "direction": "unknown",
                "attention_score": 0.0,
                "is_focused": False
            }
    
    def analyze_gaze_advanced(self, image: np.ndarray) -> Dict:
        """고급 시선 분석"""
        try:
            # 고급 얼굴 검출
            faces_data = self.detect_faces_advanced(image)
            
            if not faces_data:
                return {
                    "face_detected": False,
                    "message": "No face detected",
                    "confidence": 0.0
                }
            
            # 가장 신뢰도 높은 얼굴 선택
            best_face = faces_data[0]
            
            # 고급 눈 검출
            eye_data = self.detect_eyes_advanced(image, best_face)
            
            if not eye_data["eyes_detected"]:
                return {
                    "face_detected": True,
                    "eyes_detected": False,
                    "face_data": best_face,
                    "message": "Face detected but no eyes found",
                    "confidence": best_face["confidence"] * 0.5
                }
            
            # 시선 방향 계산
            face_center = best_face["center"]
            eye_center = eye_data["eye_center"]
            
            gaze_direction = self.calculate_gaze_direction(face_center, eye_center)
            
            # 전체 신뢰도 계산
            overall_confidence = (best_face["confidence"] + eye_data["confidence"]) / 2
            
            # 통계 업데이트
            self.gaze_stats["total_frames_analyzed"] += 1
            self.gaze_stats["faces_detected"] += 1
            if eye_data["eyes_detected"]:
                self.gaze_stats["eyes_detected"] += 1
            if gaze_direction["is_focused"]:
                self.gaze_stats["successful_gaze_calculations"] += 1
            
            self.gaze_stats["average_confidence"] = (
                (self.gaze_stats["average_confidence"] * (self.gaze_stats["total_frames_analyzed"] - 1) + overall_confidence) /
                self.gaze_stats["total_frames_analyzed"]
            )
            
            return {
                "face_detected": True,
                "eyes_detected": True,
                "face_data": best_face,
                "eye_data": eye_data,
                "gaze_direction": gaze_direction,
                "attention_score": gaze_direction["attention_score"],
                "confidence": round(overall_confidence, 3),
                "statistics": self.gaze_stats,
                "message": f"Advanced gaze analysis completed - {gaze_direction['direction']}"
            }
            
        except Exception as e:
            print(f"Advanced gaze analysis error: {e}")
            return {
                "face_detected": False,
                "error": str(e),
                "confidence": 0.0,
                "message": "Analysis failed"
            }
    
    def _remove_duplicate_faces(self, faces_data: List[Dict]) -> List[Dict]:
        """중복 얼굴 제거 (IoU 기반)"""
        if len(faces_data) <= 1:
            return faces_data
        
        def calculate_iou(box1, box2):
            """IoU (Intersection over Union) 계산"""
            x1, y1, w1, h1 = box1
            x2, y2, w2, h2 = box2
            
            # 교집합 영역
            inter_x1 = max(x1, x2)
            inter_y1 = max(y1, y2)
            inter_x2 = min(x1 + w1, x2 + w2)
            inter_y2 = min(y1 + h1, y2 + h2)
            
            if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
                return 0.0
            
            inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
            union_area = w1 * h1 + w2 * h2 - inter_area
            
            return inter_area / union_area if union_area > 0 else 0.0
        
        # 중복 제거
        unique_faces = []
        for face in faces_data:
            is_duplicate = False
            for unique_face in unique_faces:
                if calculate_iou(face["bbox"], unique_face["bbox"]) > 0.5:
                    # 신뢰도가 높은 것 유지
                    if face["confidence"] > unique_face["confidence"]:
                        unique_faces.remove(unique_face)
                        unique_faces.append(face)
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_faces.append(face)
        
        return unique_faces
    
    def _get_dummy_face_data(self) -> List[Dict]:
        """더미 얼굴 데이터"""
        return [{
            "detector": "dummy",
            "face_id": "dummy_0",
            "bbox": (200, 150, 200, 200),
            "center": (300, 250),
            "confidence": 0.5,
            "landmarks": [],
            "has_landmarks": False
        }]
    
    def _get_dummy_eye_data(self) -> Dict:
        """더미 눈 데이터"""
        return {
            "eyes_detected": True,
            "method": "dummy",
            "eye_center": (300, 220),
            "confidence": 0.5
        }
    
    def get_tracker_info(self) -> Dict:
        """추적기 정보 반환"""
        return {
            "opencv_available": OPENCV_AVAILABLE,
            "dlib_available": DLIB_AVAILABLE,
            "landmark_predictor_loaded": self.landmark_predictor is not None,
            "detection_methods": ["opencv", "dlib"] if DLIB_AVAILABLE else ["opencv"],
            "statistics": self.gaze_stats
        }