import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

import { classSummaryData, studentDetailData } from "../../data/AdminDummyData";

export default function AdminHomePage() {
  const navigate = useNavigate();
  const { classId } = useParams(); // ✅ 라우트에서 classId 가져오기
  // studentDetailData 기반으로 studentCount 업데이트
  const mergedData = classSummaryData.map((subject) => {
    const detail = studentDetailData.find((d) => d.courseId === subject.id);
    return {
      ...subject,
      studentCount: detail?.students?.length || 0,
    };
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 space-y-4">
          <h1 className="text-2xl font-bold">관리자 대시보드 - 과목 선택</h1>
          <div className="grid grid-cols-3 gap-4">
            {mergedData.map((subject) => (
              <div
                key={subject.id}
                className="p-6 bg-white rounded-xl shadow hover:bg-blue-100 cursor-pointer"
                onClick={() => navigate(`/class/${classId}/adminDashboard/kpi/${subject.id}`)} // ✅ classId 포함
              >
                <h2 className="text-lg font-semibold">{subject.name}</h2>
                <p className="text-gray-500">{subject.studentCount}명 수강</p>
              </div>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
