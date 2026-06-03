# app/models/schema.py
from pydantic import BaseModel
from typing import List, Optional

class Interval(BaseModel):
    start: int                 # epoch ms
    end: int                   # epoch ms
    durationSec: Optional[int] = None
    avgScore: Optional[float] = None

class LlmQuizRequest(BaseModel):
    classId: int
    courseId: int
    lectureId: int
    userId: str
    vttText: str
    intervals: List[Interval]

class Option(BaseModel):
    label: str
    text: str

class QuizItem(BaseModel):
    question: str
    options: List[Option]
    answer: str
