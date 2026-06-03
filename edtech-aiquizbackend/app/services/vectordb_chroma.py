# app/services/vectordb_chroma.py
from __future__ import annotations
import os, json, pickle, re
from typing import List, Dict, Tuple
import numpy as np

import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from rank_bm25 import BM25Okapi

def _tok(s: str) -> List[str]:
    # 초간단 토크나이저 (영/한 공백 기준)
    # 필요하면 형태소 분석기/regex 더 정교화
    s = s.lower()
    return re.findall(r"[가-힣A-Za-z0-9]+", s)

class _BM25Store:
    """
    lecture_id(=namespace)별 BM25 인덱스를 디스크에 저장/로드.
    Chroma는 벡터 전용, BM25는 파일로 유지(하이브리드).
    """
    def __init__(self, root: str = "./_rag_index"):
        self.root = root
        os.makedirs(self.root, exist_ok=True)

    def _paths(self, ns: str) -> Tuple[str, str]:
        base = os.path.join(self.root, f"{ns}")
        return base + ".bm25.pkl", base + ".chunks.jsonl"

    def build(self, namespace: str, chunks: List[Dict]):
        texts = [c["text"] for c in chunks]
        tokenized = [_tok(t) for t in texts]
        bm25 = BM25Okapi(tokenized)
        p_bm25, p_chunks = self._paths(namespace)
        with open(p_bm25, "wb") as f:
            pickle.dump(bm25, f)
        with open(p_chunks, "w", encoding="utf-8") as f:
            for c in chunks:
                f.write(json.dumps(c, ensure_ascii=False) + "\n")

    def _load(self, namespace: str):
        p_bm25, p_chunks = self._paths(namespace)
        if not (os.path.exists(p_bm25) and os.path.exists(p_chunks)):
            return None
        with open(p_bm25, "rb") as f:
            bm25 = pickle.load(f)
        chunks = []
        with open(p_chunks, "r", encoding="utf-8") as f:
            for line in f:
                chunks.append(json.loads(line))
        return bm25, chunks

    def search(self, namespace: str, query: str, top_k: int = 10) -> List[Dict]:
        loaded = self._load(namespace)
        if loaded is None:
            return []
        bm25, chunks = loaded
        scores = bm25.get_scores(_tok(query))
        idx = np.argsort(scores)[::-1][:top_k]
        out = []
        for i in idx:
            out.append({
                "chunk": chunks[int(i)],
                "score": float(scores[int(i)]),
                "mode": "bm25"
            })
        return out


class ChromaVectorDB:
    """
    - 단일 컬렉션: 'lecture_chunks'
    - metadata.where로 lecture_id 필터
    - 임베딩: OpenAI text-embedding-3-small
    - BM25는 _BM25Store로 하이브리드
    """
    def __init__(self, persist_dir: str = "./_chroma", bm25_dir: str = "./_rag_index"):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.embedding_fn = OpenAIEmbeddingFunction(
            api_key=os.environ.get("OPENAI_API_KEY"),
            model_name="text-embedding-3-small"
        )
        # cosine 거리 사용
        self.col = self.client.get_or_create_collection(
            name="lecture_chunks",
            metadata={"hnsw:space": "cosine"},
            embedding_function=self.embedding_fn
        )
        self.bm25 = _BM25Store(bm25_dir)

    def upsert_chunks(self, namespace: str, chunks: List[Dict]):
        """
        chunks: [{chunk_id,text,start_ms,end_ms}, ...]
        """
        ids = [c["chunk_id"] for c in chunks]
        docs = [c["text"] for c in chunks]
        metas = [{
            "lecture_id": str(namespace),
            "start_ms": int(c["start_ms"]),
            "end_ms": int(c["end_ms"])
        } for c in chunks]

        # Chroma upsert
        self.col.upsert(ids=ids, documents=docs, metadatas=metas)

        # BM25 인덱스도 갱신
        self.bm25.build(namespace, chunks)

    def search_vector(self, namespace: str, query: str, top_k: int = 10) -> List[Dict]:
        res = self.col.query(
            query_texts=[query],
            where={"lecture_id": str(namespace)},
            n_results=top_k,
            include=["distances", "metadatas", "documents", "ids"]
        )
        # Chroma는 distances(작을수록 유사). score는 1 - dist로 변환
        ids = res.get("ids", [[]])[0]
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]

        out = []
        for i in range(len(ids)):
            out.append({
                "chunk": {
                    "chunk_id": ids[i],
                    "text": docs[i],
                    "start_ms": metas[i].get("start_ms"),
                    "end_ms": metas[i].get("end_ms"),
                    "lecture_id": metas[i].get("lecture_id"),
                },
                "score": float(1.0 - dists[i]),
                "mode": "vec"
            })
        return out

    def search_bm25(self, namespace: str, query: str, top_k: int = 10) -> List[Dict]:
        return self.bm25.search(namespace, query, top_k=top_k)
