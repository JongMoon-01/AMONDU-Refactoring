# app/services/summary_to_rag.py
import os
import re
from typing import List, Dict, Tuple
from openai import OpenAI
from app.services.rag_service import RAGService

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ── VTT 파싱 유틸 ──────────────────────────────────────────────────────────────

_TS = re.compile(r"(?P<s>\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(?P<e>\d{2}:\d{2}:\d{2}\.\d{3})")


def _ts_to_ms(ts: str) -> int:
    hh, mm, rest = ts.split(":")
    ss, ms = rest.split(".")
    return (int(hh) * 3600 + int(mm) * 60 + int(ss)) * 1000 + int(ms)


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
    seen = set()
    uniq = []
    for p in pieces:
        if p not in seen:
            uniq.append(p)
            seen.add(p)
    return " ".join(uniq)[:max_chars]


# ── 요약 생성 (OpenAI) ─────────────────────────────────────────────────────────

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


# ── RAG 인입 ───────────────────────────────────────────────────────────────────

def ingest_summary_to_rag(
    edtech_summary_id: int,
    content: str,
    user_id: str,
    lecture_id: int,
    course_type: str
):
    """
    요약 내용을 RAG에 인입.
    edtech_summary_id: edtech-backend가 관리하는 Summary PK (DB 저장 없이 참조만)
    """
    rag = RAGService()
    docs = [{
        "id": f"summary_{edtech_summary_id}",
        "content": content,
        "metadata": {
            "summary_id": edtech_summary_id,
            "user_id": user_id,
            "lecture_id": lecture_id,
            "course_type": course_type
        }
    }]
    rag.add_documents(course_type=course_type, docs=docs)


# ── 메인 진입점 ────────────────────────────────────────────────────────────────

def upsert_summary_from_intervals(
    *,
    edtech_summary_id: int,
    user_id: str,
    lecture_id: int,
    vtt_text: str,
    intervals: List[Dict],
    course_type: str
) -> Tuple[int, str]:
    """
    1) VTT 파싱 → intervals 교집합 텍스트 추출
    2) 요약 생성 (OpenAI)
    3) RAG 인입 (edtech_summary_id를 문서 ID로 사용)
    4) aiquiz DB에 Summary 저장 없음 — edtech-backend가 단독 관리

    반환: (edtech_summary_id, summary_content)
    """
    cues = parse_vtt(vtt_text)
    if not cues:
        raise ValueError("VTT 파싱 실패")

    ctx = text_from_intervals(cues, intervals)
    if not ctx.strip():
        ctx = " ".join([c["text"] for c in cues])[:6000]

    summary_text = summarize_context(ctx)

    ingest_summary_to_rag(
        edtech_summary_id=edtech_summary_id,
        content=summary_text,
        user_id=user_id,
        lecture_id=lecture_id,
        course_type=course_type
    )

    return edtech_summary_id, summary_text


def generate_summary_only(
    *,
    vtt_text: str,
    intervals: List[Dict]
) -> str:
    """
    DB/RAG 저장 없이 요약 텍스트만 반환.
    퀴즈 생성 파이프라인에서 즉시 사용 후 버릴 때 사용.
    """
    cues = parse_vtt(vtt_text)
    if not cues:
        raise ValueError("VTT 파싱 실패")

    ctx = text_from_intervals(cues, intervals)
    if not ctx.strip():
        ctx = " ".join([c["text"] for c in cues])[:6000]

    return summarize_context(ctx)
