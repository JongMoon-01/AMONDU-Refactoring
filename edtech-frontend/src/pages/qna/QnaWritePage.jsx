import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import boardApi from "../../api/boardApi"; // ✅ 토큰 자동 첨부 인스턴스

export default function QnaWritePage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await boardApi.post(`/classes/${classId}/qna`, {
      title,
      content,
    }); // authorId는 백엔드에서 토큰으로 식별
    navigate(`/class/${classId}/qna`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">QnA 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded h-40"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          작성 완료
        </button>
      </form>
    </div>
  );
}
