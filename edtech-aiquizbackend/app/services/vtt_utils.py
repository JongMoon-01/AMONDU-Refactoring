# app/services/vtt_utils.py
import re
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class Caption:
    start_ms: int
    end_ms: int
    text: str

_TS = re.compile(r"(\d{2}):(\d{2}):(\d{2})[.,](\d{3})")

def _ts_to_ms(ts: str) -> int:
    h, m, s, ms = map(int, _TS.match(ts).groups())
    return ((h*60 + m)*60 + s)*1000 + ms

def parse_vtt(vtt_text: str) -> List[Caption]:
    caps: List[Caption] = []
    lines = [l.strip("\ufeff ") for l in vtt_text.splitlines()]
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if "-->" in line:
            left, right = [p.strip() for p in line.split("-->")]
            start = _ts_to_ms(left)
            end = _ts_to_ms(right.split(" ")[0])
            i += 1
            buf = []
            while i < len(lines) and lines[i] and "-->" not in lines[i]:
                buf.append(lines[i].strip())
                i += 1
            text = " ".join(buf)
            # 노이즈 제거
            text = re.sub(r"\[(?:music|박수|웃음|sound).*?\]", "", text, flags=re.I)
            text = re.sub(r"<.*?>", "", text)
            text = re.sub(r"\s+", " ", text).strip()
            if text:
                caps.append(Caption(start, end, text))
        else:
            i += 1
    return caps

def slice_by_intervals(caps: List[Caption],
                       intervals: List[Tuple[int,int]],
                       pad_ms: int = 15000,
                       max_chars: int = 6000) -> List[Caption]:
    picked = []
    for s, e in intervals:
        ws, we = max(0, s - pad_ms), e + pad_ms
        for c in caps:
            if c.end_ms < ws or c.start_ms > we:
                continue
            picked.append(c)
    picked.sort(key=lambda c: (c.start_ms, c.end_ms))
    # 중복 제거
    dedup, seen = [], set()
    for c in picked:
        key = (c.start_ms, c.end_ms, c.text)
        if key not in seen:
            seen.add(key)
            dedup.append(c)
    # 길이 제한
    acc, total = [], 0
    for c in dedup:
        if total + len(c.text) > max_chars: break
        acc.append(c); total += len(c.text)
    return acc
