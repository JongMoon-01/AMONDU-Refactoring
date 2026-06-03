import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import boardApi from "../../api/boardApi";

export default function NoticeDetailPage() {
  const { classId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  useEffect(() => {
  (async () => {
    const res = await boardApi.get(`/classes/${classId}/notices/${postId}`);
    const data = res.data;

    // boardApi.baseURL: http://localhost:8083/api  → 파일 기본 URL: http://localhost:8083/files/...
    const apiBase = boardApi.defaults.baseURL || "";
    const fileBase = apiBase.replace(/\/api\/?$/, ""); // http://localhost:8083
    const fileUrl = data.fileUrl ?? (data.fileName ? `${fileBase}/files/${data.fileName}` : null);

    setPost({ ...data, fileUrl });
  })();
}, [classId, postId]);

  const handleDelete = async () => {
    await boardApi.delete(`/classes/${classId}/notices/${postId}`);
    navigate(`/class/${classId}/notice`);
  };

  

  if (!post) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
      <p className="text-sm text-gray-500 mb-4">
        {(post.authorName || post.authorId || "작성자 미표시")} ·{" "}
        {post.createdAt ? new Date(post.createdAt).toLocaleString() : "-"}
      </p>
      <div className="whitespace-pre-wrap mb-4">{post.content}</div>

      {post.fileUrl && (
  <div className="mt-4 space-y-2">
    {/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(post.fileUrl) && (
      <img src={post.fileUrl} alt="attachment" className="max-w-md border rounded" />
    )}
    <a href={post.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
      첨부파일 열기
    </a>
  </div>
)}

      <div className="mt-6 space-x-2">
        <button
          onClick={() => navigate(`/class/${classId}/notice/${postId}/edit`)}
          className="px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500"
        >
          수정
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
