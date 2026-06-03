# app/services/quiz_quality.py
from typing import List, Dict
from app.services.vtt_utils import Caption

def _covers(evi: Dict, cap: Caption) -> bool:
    return not (evi["end_ms"] < cap.start_ms or evi["start_ms"] > cap.end_ms)

def validate_item(item: Dict, caps: List[Caption]) -> bool:
    t = item.get("type")
    if t not in ("MCQ", "OX"): return False
    if not item.get("question"): return False

    opts = item.get("options", [])
    labels = [o.get("label") for o in opts]

    if t == "MCQ":
        if labels != ["A","B","C","D"]: return False
        if item.get("answer") not in labels: return False
    else:
        if set(labels) != {"O","X"}: return False
        if item.get("answer") not in {"O","X"}: return False

    evidence = item.get("evidence", [])
    if not evidence: return False
    ok = any(_covers(e, c) for e in evidence for c in caps)
    return ok

def filter_valid(items: List[Dict], caps: List[Caption]) -> List[Dict]:
    out, seen_q = [], set()
    for it in items:
        try:
            q = it.get("question","").strip()
            if q and q not in seen_q and validate_item(it, caps):
                out.append(it); seen_q.add(q)
        except Exception:
            pass
    return out
