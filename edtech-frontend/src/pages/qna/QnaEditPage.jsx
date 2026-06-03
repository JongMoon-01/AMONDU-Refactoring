// src/pages/qna/QnaEditPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import boardApi from "../../api/boardApi";

export default function QnaEditPage() {
  const { classId, postId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await boardApi.get(`/classes/${classId}/qna/${postId}`);
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
      } catch (e) {
        console.error("QnA 상세 불러오기 실패:", e);
        if (e.response?.status === 403) {
          alert("이 강의에 접근 권한이 없습니다.");
          navigate(`/class/${classId}/qna`);
        }
      }
    };
    load();
  }, [classId, postId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 백엔드 시그니처: QnaPostDto.Update(title, content)
      await boardApi.put(`/classes/${classId}/qna/${postId}`, {
        title,
        content,
      });
      navigate(`/class/${classId}/qna/${postId}`);
    } catch (e) {
      console.error("QnA 수정 실패:", e);
      alert("수정에 실패했습니다.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">글 수정</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="제목"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded h-40"
          placeholder="내용"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          수정 완료
        </button>
      </form>
    </div>
  );
}
