# app/services/rag_service.py
from dataclasses import dataclass
from typing import List, Dict
import hashlib, os, json

from app.services.vectordb_chroma import ChromaVectorDB   # ⬅️ 변경
from .text_proc import extract_keyphrases, mmr_select
from .rerank import identity_rerank

@dataclass
class RagConfig:
    top_k_vec: int = 12
    top_k_bm25: int = 12
    final_k_rerank: int = 20
    out_k: int = 8
    index_dir: str = os.environ.get("RAG_INDEX_DIR", "./_rag_index")
    chroma_dir: str = os.environ.get("CHROMA_DIR", "./_chroma")   # ⬅️ 추가

def _hash_text(txt: str) -> str:
    import hashlib
    return hashlib.sha256(txt.encode("utf-8")).hexdigest()

class RAGService:
    def __init__(self, config: RagConfig = RagConfig()):
        self.cfg = config
        os.makedirs(self.cfg.index_dir, exist_ok=True)
        os.makedirs(self.cfg.chroma_dir, exist_ok=True)
        self.db = ChromaVectorDB(
            persist_dir=self.cfg.chroma_dir,
            bm25_dir=self.cfg.index_dir
        )

    def _status_path(self, lecture_id: int) -> str:
        return os.path.join(self.cfg.index_dir, f"{lecture_id}.status.json")

    def ensure_indexed(self, lecture_id: int, captions: List[Dict]):
        text_all = "\n".join(c["text"] for c in captions)
        h = _hash_text(text_all)
        p = self._status_path(lecture_id)
        if os.path.exists(p):
            try:
                cur = json.load(open(p, "r", encoding="utf-8"))
                if cur.get("hash") == h:
                    return  # up-to-date
            except:
                pass

        chunks = []
        for i, c in enumerate(captions):
            chunks.append({
                "chunk_id": f"{lecture_id}-{i}",
                "text": c["text"],
                "start_ms": int(c["start_ms"]),
                "end_ms": int(c["end_ms"]),
            })
        self.db.upsert_chunks(str(lecture_id), chunks)
        json.dump({"hash": h}, open(p, "w", encoding="utf-8"))

    def retrieve_for_quiz(self, lecture_id: int, anchor_text: str) -> List[Dict]:
        queries = extract_keyphrases(anchor_text, topn=5) or [anchor_text]

        vec_hits = []
        for q in queries:
            vec_hits.extend(self.db.search_vector(str(lecture_id), q, top_k=self.cfg.top_k_vec))
        bm_hits = self.db.search_bm25(str(lecture_id), " ".join(queries), top_k=self.cfg.top_k_bm25)

        fused = rrf_fuse(vec_hits, bm_hits)
        fused = dedup_by_chunk_id(fused)

        reranked = identity_rerank(anchor_text, fused)[: self.cfg.final_k_rerank]
        return mmr_select(reranked, k=self.cfg.out_k, lambda_diversity=0.5)

def rrf_fuse(a: List[Dict], b: List[Dict], k: float = 60.0) -> List[Dict]:
    scores = {}
    for lst in (a, b):
        for rank, item in enumerate(lst, start=1):
            cid = item["chunk"]["chunk_id"]
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank)
    cache = {}
    for item in (a + b):
        cache[item["chunk"]["chunk_id"]] = item["chunk"]
    merged = [{"chunk": cache[cid], "score": sc} for cid, sc in scores.items()]
    merged.sort(key=lambda x: x["score"], reverse=True)
    return merged

def dedup_by_chunk_id(items: List[Dict]) -> List[Dict]:
    seen = set()
    out = []
    for it in items:
        cid = it["chunk"]["chunk_id"]
        if cid in seen: continue
        seen.add(cid)
        out.append(it)
    return out
