import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import boardApi from "../../api/boardApi";

export default function QnaListPage() {
  const { classId } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchQna = async () => {
      try {
        const res = await boardApi.get(`/classes/${classId}/qna`, {
          params: { page: 0, size: 10, sort: "id,desc" },
        });
        setPosts(res.data.content || res.data);
      } catch (err) {
        console.error("QnA 불러오기 실패:", err);
      }
    };
    fetchQna();
  }, [classId]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">QnA 게시판</h2>
      <Link
        to={`/class/${classId}/qna/new`}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        글 작성
      </Link>

      <ul className="mt-4 space-y-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              to={`/class/${classId}/qna/${post.id}`}
              className="block p-4 border rounded hover:bg-gray-50"
            >
              <h3 className="font-bold">{post.title}</h3>
              <p className="text-sm text-gray-500">
                {post.author} ·{" "}
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleString()
                  : "날짜 없음"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
