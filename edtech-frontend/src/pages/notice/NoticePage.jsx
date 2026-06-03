import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import boardApi from "../../api/boardApi";

export default function NoticePage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
  boardApi
    .get(`/classes/${classId}/notices`, { params: { page: 0, size: 10, sort: "id,desc" }})
    .then(res => setPosts(res.data.content ?? res.data))
    .catch(err => console.error("공지 목록 불러오기 실패:", err));
}, [classId]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">클래스 공지 게시판</h2>
        <button
          onClick={() => navigate(`/class/${classId}/notice/write`)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          글 작성하기
        </button>
      </div>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            onClick={() => navigate(`/class/${classId}/notice/${post.id}`)}
            className="p-4 bg-white shadow rounded cursor-pointer hover:bg-blue-50"
          >
            <h3 className="font-semibold text-lg">{post.title}</h3>
            <p className="text-sm text-gray-500">
              {(post.authorName || post.authorId || "작성자 미표시")} ·{" "}
              {post.createdAt ? new Date(post.createdAt).toLocaleString() : "-"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
