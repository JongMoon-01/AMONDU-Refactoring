import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { classSummaryData, studentDetailData } from "../../data/AdminDummyData";
import { calculateClassKpiSummary } from "../../utils/chartDataHelper";
import MiniChart from "../../components/Admin/charts/MiniChart";

export default function AdminKpiPage() {
  const { classId, courseId } = useParams();
  const navigate = useNavigate();

  const subjectInfo = classSummaryData.find((c) => c.id === courseId);
  const students = studentDetailData.find((c) => c.courseId === courseId)?.students || [];

  if (!subjectInfo) {
    return <div className="p-6 text-center">데이터를 찾을 수 없습니다.</div>;
  }

  const { avgAttendance, avgReview, avgFocus } = calculateClassKpiSummary(students);

  let latestAvgScore = 0;
  if (students.length > 0) {
    const maxLength = Math.max(...students.map((s) => s.scoreHistory?.length || 0));
    const lastIndex = maxLength - 1;
    const scores = students
      .map((s) => s.scoreHistory?.[lastIndex])
      .filter((v) => v != null);
    if (scores.length > 0) {
      latestAvgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  const kpis = [
    { key: "attendance", label: "평균 출석률", color: "text-blue-500", value: `${avgAttendance}%` },
    { key: "review", label: "평균 복습률", color: "text-green-500", value: `${avgReview}%` },
    { key: "focus", label: "평균 집중률", color: "text-purple-500", value: `${avgFocus}%` },
    { key: "score", label: "평균 시험 점수", color: "text-[#FF6B6B]", value: `${latestAvgScore}점` },
    { key: "response", label: "응답 시간 분포", color: "text-[#FFC107]", value: "차트로 보기" },
    { key: "weeklyFocus", label: "주간 집중도 변화", color: "text-gray-700", value: "차트로 보기" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">

        <main className="flex-1 p-6 space-y-6">
          <button
            onClick={() => navigate(`/class/${classId}/adminDashboard`)}
            className="mb-4 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg font-semibold"
          >
            ← 홈으로
          </button>

          <h2 className="text-2xl font-bold mb-4">📊 관리자 KPI 요약 ({subjectInfo.name})</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow cursor-pointer hover:shadow-2xl transition flex flex-col items-center h-[280px] w-full"
                onClick={() => navigate(`/class/${classId}/adminDashboard/kpi/${courseId}/${kpi.key}`)}
              >
                <p className="text-sm text-gray-500 mb-2">{kpi.label}</p>
                <p className={`text-3xl font-extrabold ${kpi.color} mb-4`}>{kpi.value}</p>

                <div className="w-full flex-1">
                  <MiniChart type={kpi.key} courseId={courseId} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
