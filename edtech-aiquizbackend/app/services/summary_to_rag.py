# app/services/summary_to_rag.py
import os, re
from typing import List, Dict, Tuple
from openai import OpenAI
from sqlalchemy.orm import Session
from app.models.summary_model import Summary
from app.services.rag_service import RAGService

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- VTT 파싱 유틸 ---
_TS = re.compile(r"(?P<s>\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(?P<e>\d{2}:\d{2}:\d{2}\.\d{3})")

def _ts_to_ms(ts: str) -> int:
    hh, mm, rest = ts.split(":")
    ss, ms = rest.split(".")
    return (int(hh)*3600 + int(mm)*60 + int(ss))*1000 + int(ms)

def parse_vtt(vtt_text: str) -> List[Dict]:
    lines = vtt_text.splitlines()
    cues: List[Dict] = []
    i = 0
    while i < len(lines):
        m = _TS.search(lines[i])
        if not m:
            i += 1
            continue
        s = _ts_to_ms(m.group("s"))
        e = _ts_to_ms(m.group("e"))
        i += 1
        texts = []
        while i < len(lines) and lines[i].strip() != "" and not _TS.search(lines[i]):
            texts.append(lines[i].strip())
            i += 1
        if texts:
            cues.append({"start": s, "end": e, "text": " ".join(texts)})
    return cues

def _overlap(a0: int, a1: int, b0: int, b1: int) -> bool:
    return max(a0, b0) < min(a1, b1)

def text_from_intervals(cues: List[Dict], intervals: List[Dict], max_chars: int = 10000) -> str:
    pieces: List[str] = []
    for it in intervals:
        for c in cues:
            if _overlap(it["start"], it["end"], c["start"], c["end"]) and c["text"]:
                pieces.append(c["text"])
    # dedup
    seen = set(); uniq = []
    for p in pieces:
        if p not in seen:
            uniq.append(p); seen.add(p)
    return " ".join(uniq)[:max_chars]

# --- 요약 생성 ---
_SUMMARY_PROMPT = """너는 대학 강의 조교다. 아래 자막 일부(학생이 집중하지 못한 구간)를 간결하게 요약하라.
- 핵심 개념, 정의, 수식/절차, 주의할 오해포인트를 항목으로 정리
- 한국어로 작성, 불필요한 서론 금지
- 최대 400~600자 내외

자막:
{context}
"""

def summarize_context(text: str) -> str:
    msg = _SUMMARY_PROMPT.format(context=text.strip()[:6000])
    rsp = _client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": msg}],
        temperature=0.2
    )
    return rsp.choices[0].message.content.strip()

# --- DB 저장 + RAG 인입 ---
def save_summary(db: Session, user_id: str, lecture_id: int, content: str) -> Summary:
    s = Summary(user_id=user_id, lecture_id=lecture_id, content=content)
    db.add(s)
    db.flush()  # id 생성
    return s

def ingest_summary_to_rag(summary: Summary, course_type: str):
    rag = RAGService()
    docs = [{
        "id": f"summary_{summary.summary_id}",
        "content": summary.content,
        "metadata": {
            "user_id": summary.user_id,
            "lecture_id": summary.lecture_id,
            "course_type": course_type
        }
    }]
    rag.add_documents(course_type=course_type, docs=docs)

def upsert_summary_from_intervals(db: Session, *, user_id: str, lecture_id: int,
                                  vtt_text: str, intervals: List[Dict],
                                  course_type: str) -> Tuple[int, str]:
    """
    1) VTT 파싱 → intervals 교집합 텍스트 추출
    2) 요약 생성(OpenAI)
    3) Summary 테이블 저장
    4) RAG 인입
    반환: (summary_id, content)
    """
    cues = parse_vtt(vtt_text)
    if not cues:
        raise ValueError("VTT 파싱 실패")

    ctx = text_from_intervals(cues, intervals)
    if not ctx.strip():
        # 교집합 없으면 전체에서 상위 일부 사용(원치 않으면 예외로 바꿔도 됨)
        ctx = " ".join([c["text"] for c in cues])[:6000]

    summary_text = summarize_context(ctx)
    s = save_summary(db, user_id=user_id, lecture_id=lecture_id, content=summary_text)
    ingest_summary_to_rag(s, course_type=course_type)
    db.commit()
    return s.summary_id, summary_text
