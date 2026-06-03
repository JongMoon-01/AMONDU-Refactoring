import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import boardApi from "../api/boardApi";

/**
 * @props
 * - classId: number|string
 * - board: 'notice' | 'qna'
 * - to: 목록으로 이동할 경로 (예: `/class/${classId}/notice`)
 * - title: 카드 제목
 * - limit: 미리보기 개수 (기본 3)
 */
export default function BoardPreview({ classId, board, to, title, limit = 3 }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 백엔드 페이징 규약에 맞게 조정
        const url =
          board === "notice"
            ? `/classes/${classId}/notices?page=0&size=${limit}&sort=id,desc`
            : `/classes/${classId}/qna?page=0&size=${limit}&sort=id,desc`;

        const res = await boardApi.get(url);
        // Spring Page 반환 가정: res.data.content
        const rows = Array.isArray(res.data?.content) ? res.data.content : res.data;
        setItems(rows ?? []);
      } catch (e) {
        console.error("[BoardPreview] fetch error:", e?.response || e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, board, limit]);

  const goList = () => navigate(to);
  const goDetail = (id) =>
    navigate(
      board === "notice"
        ? `/class/${classId}/notice/${id}`
        : `/class/${classId}/qna/${id}`
    );

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={goList}
          className="text-sm text-blue-600 hover:underline"
        >
          더보기
        </button>
      </div>

      {loading ? (
        <ul className="animate-pulse space-y-3">
          {[...Array(limit)].map((_, i) => (
            <li key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">최근 게시글이 없습니다.</div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => (
            <li
              key={it.id || it.postId}
              onClick={() => goDetail(it.id ?? it.postId)}
              className="py-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <p className="truncate text-gray-800 group-hover:text-blue-600">
                  {it.title}
                </p>
                <span className="ml-3 shrink-0 text-xs text-gray-400">
                  {formatDate(it.updatedAt || it.createdAt)}
                </span>
              </div>
              {it.fileName || it.fileUrl ? (
                <span className="mt-1 inline-block text-[11px] text-gray-500">
                  📎 첨부 있음
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(s) {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
}
