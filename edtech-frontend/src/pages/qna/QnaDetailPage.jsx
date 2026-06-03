// src/pages/qna/QnaDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import boardApi from "../../api/boardApi";      // ★ axios 말고 boardApi 사용
import QnaComment from "./QnaComment";

export default function QnaDetailPage() {
  const { classId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        // ★ 엔드포인트 복수형 + 8083 베이스
        const { data } = await boardApi.get(`/classes/${classId}/qna/${postId}`);
        setPost(data);
      } catch (e) {
        console.error("QnA 상세 조회 실패:", e);
        if (e.response?.status === 401) {
          // 로그인 만료시 처리 필요하면 여기서
        } else if (e.response?.status === 403) {
          alert("이 강의에 수강 등록되어 있지 않습니다.");
          navigate(`/class/${classId}`);
        }
      }
    };
    fetchDetail();
  }, [classId, postId, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("삭제할까요?")) return;
    try {
      await boardApi.delete(`/classes/${classId}/qna/${postId}`); // ★ 복수형 + boardApi
      navigate(`/class/${classId}/qna`);
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제에 실패했습니다.");
    }
  };

  if (!post) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
      <p className="text-sm text-gray-500 mb-4">
        {post.author ?? post.authorId} ·{" "}
        {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
      </p>
      <div className="whitespace-pre-wrap mb-4">{post.content}</div>
      <div className="space-x-2 mt-4">
        <button
          onClick={() => navigate(`/class/${classId}/qna/${postId}/edit`)}
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
      <hr className="my-6" />
      <QnaComment classId={classId} postId={postId} />
    </div>
  );
}
