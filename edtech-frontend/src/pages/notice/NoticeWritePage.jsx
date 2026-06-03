import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import boardApi from "../../api/boardApi";

export default function NoticeWritePage() {
  const { classId } = useParams(); // ✅ postId 없음
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (file) formData.append("file", file);

      // ✅ 작성은 POST
      const res = await boardApi.post(`/classes/${classId}/notices`, formData);

      // 백엔드 응답 키에 맞춰 ID 추출
      const newId = res.data?.postId ?? res.data?.id;
      navigate(`/class/${classId}/notice/${newId}`);
    } catch (err) {
      console.error("공지 작성 실패:", err?.response || err);
      alert("공지 작성에 실패했습니다.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">공지 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-2 border rounded" value={title} onChange={e=>setTitle(e.target.value)} required />
        <textarea className="w-full p-2 border rounded h-40" value={content} onChange={e=>setContent(e.target.value)} required />
        <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">등록</button>
      </form>
    </div>
  );
}
