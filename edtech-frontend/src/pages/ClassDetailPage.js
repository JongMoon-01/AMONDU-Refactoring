// pages/ClassDetailPage.js
import React from "react";
import Sidebar from "../components/Sidebar";
import CourseCarousel from "../components/CourseCarousel";
import BoardPreview from "../components/BoardPreview";
import { useParams } from "react-router-dom";

export default function ClassDetailPage() {
  const { classId } = useParams();
  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <div className="flex flex-grow">
        <Sidebar />

        <main className="flex-1 p-6">
          <CourseCarousel classId={classId} />

          <div className="mt-10 grid grid-cols-2 gap-6">
            <BoardPreview
    title="클래스 공지 게시판"
    board="notice"
    classId={classId}
    to={`/class/${classId}/notice`}
  />
  <BoardPreview
    title="질문 게시판"
    board="qna"
    classId={classId}
    to={`/class/${classId}/qna`}
  />
          </div>
        </main>
      </div>
    </div>
  );
}
