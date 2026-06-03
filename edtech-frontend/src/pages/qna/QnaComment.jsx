// src/pages/qna/QnaComment.jsx
import React, { useEffect, useState } from "react";
import boardApi from "../../api/boardApi";

export default function QnaComment({ classId, postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const { data } = await boardApi.get(
        `/classes/${classId}/qna/${postId}/comments`
      );
      setComments(data);
    } catch (e) {
      console.error("댓글 조회 실패:", e);
      if (e.response?.status === 403) {
        alert("이 강의 댓글을 볼 권한이 없습니다.");
      }
    }
  };

  useEffect(() => {
    if (!classId || !postId) return;
    fetchComments();
  }, [classId, postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await boardApi.post(
        `/classes/${classId}/qna/${postId}/comments`,
        { content: newComment } // authorId는 서버에서 토큰으로 식별
      );
      setNewComment("");
      fetchComments();
    } catch (e) {
      console.error("댓글 작성 실패:", e);
      const s = e.response?.status;
      if (s === 403) alert("이 강의에 접근 권한이 없습니다.");
      else alert("댓글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">댓글</h3>
      <form onSubmit={handleSubmit} className="mb-4 space-x-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="p-2 border rounded w-3/4"
          placeholder="댓글 작성..."
        />
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          disabled={submitting || !newComment.trim()}
        >
          {submitting ? "작성 중..." : "작성"}
        </button>
      </form>

      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="p-2 border rounded">
            <p className="text-sm">{c.content}</p>
            <p className="text-xs text-gray-500">
              {/* 백엔드 필드명이 authorId라면 화면에서 닉네임 없을 수 있으니 안전 처리 */}
              {(c.author ?? c.authorId ?? "작성자 미표시")} ·{" "}
              {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
