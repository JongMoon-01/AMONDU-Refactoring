import React from "react";
import Sidebar from "../components/Sidebar";
import CourseSidebar from "../components/CourseSidebar";
import CalendarSection from "../components/CalendarSection"; // ✅ 추가

export default function CourseDetailPage() {
  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* 왼쪽: 전역 사이드바 */}
      <Sidebar />

      {/* 가운데: 강의 전용 메뉴 */}
      <CourseSidebar />

      {/* 오른쪽: 메인 콘텐츠 */}
      <main className="flex-1 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">강의 화면</h2>

        {/* ✅ 캘린더 컴포넌트 삽입 */}
        <CalendarSection />

        {/* 콘텐츠 */}
        <div className="bg-white rounded-xl p-4 shadow flex items-center justify-center h-48 text-gray-400">
          콘텐츠가 없습니다.
        </div>
      </main>
    </div>
  );
}
