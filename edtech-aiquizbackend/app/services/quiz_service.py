# app/services/quiz_service.py
import json
from typing import List, Dict
from dotenv import load_dotenv 
from openai import OpenAI
from app.models.schema import LlmQuizRequest
from app.services.vtt_utils import parse_vtt, slice_by_intervals, Caption
from app.services.quiz_quality import filter_valid


# ✅ .env 먼저 로드
load_dotenv()

client = OpenAI()

SYSTEM_MSG = (
    "너는 교육용 퀴즈 출제기다. 제공된 컨텍스트(자막)에서만 출제하고 외부지식 사용 금지. "
    "모든 문항에 evidence(자막 타임코드)를 포함한다. 출력은 JSON 배열만."
)

USER_TMPL = """\
[컨텍스트]
아래는 강의 자막 일부다. 각 행의 형식은 (start_ms,end_ms) text 이다.

{context}

[요구사항]
- 총 5문항: OX 2개, 4지선다 3개
- 보기/정답은 컨텍스트에서 파생(동의어/패러프레이즈 가능, 날조 금지)
- 모호/상식 문제 금지. 명시된 사실/정의/수치/절차에 근거
- 각 문항에 evidence: [{{"start_ms":..., "end_ms":...}}] 최소 1개 포함
- JSON 스키마:
[
  {{
    "type": "MCQ" | "OX",
    "question": "....",
    "options": [{{"label":"A","text":"..."}}, ...],  // OX는 O/X 두 개
    "answer": "A" | "B" | "C" | "D" | "O" | "X",
    "evidence": [{{"start_ms":12345,"end_ms":15678}}]
  }}, ...
]
- 한글로 작성.
"""

def _build_context(caps: List[Caption]) -> str:
    return "\n".join(f"- ({c.start_ms},{c.end_ms}) {c.text}" for c in caps)

def _call_llm(context_caps: List[Caption]) -> List[Dict]:
    ctx = _build_context(context_caps)
    messages = [
        {"role":"system","content": SYSTEM_MSG},
        {"role":"user","content": USER_TMPL.format(context=ctx)},
    ]
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.2,
        top_p=0.9
    )
    raw = resp.choices[0].message.content
    return json.loads(raw)

def generate_from_intervals(req: LlmQuizRequest) -> List[Dict]:
    if not req.intervals:
        return []

    caps = parse_vtt(req.vttText)
    intervals = [(i.start, i.end) for i in req.intervals]
    ctx_caps = slice_by_intervals(caps, intervals, pad_ms=15000, max_chars=6000)
    if not ctx_caps:
        return []

    # 1차 생성 + 검증
    items = _call_llm(ctx_caps)
    valid = filter_valid(items, ctx_caps)

    # 부족하면 간단 재시도
    tries = 0
    while len(valid) < 5 and tries < 2:
        more = _call_llm(ctx_caps)
        valid = filter_valid(valid + more, ctx_caps)
        tries += 1

    return valid[:5]
