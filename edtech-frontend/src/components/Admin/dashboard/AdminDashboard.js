import React from "react";
import { classSummaryData } from "../../data/AdminDummyData";
import AdminFocusLineChart from "../Admin/charts/AdminFocusLineChart";
import AdminResponseHistogram from "../Admin/charts/AdminResponseHistogram";
import AdminWeeklyAreaChart from "../Admin/charts/AdminWeeklyAreaChart";

function AdminDashboard() {
  const summary = classSummaryData[0]; // 첫 번째 과목 요약

  return (
    <div className="space-y-6 p-6">
      {/* KPI 카드 영역 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 shadow rounded-xl">
          <p>수강 인원</p>
          <h2 className="text-2xl font-bold">{summary.studentCount}명</h2>
        </div>
        <div className="bg-white p-4 shadow rounded-xl">
          <p>평균 출석률</p>
          <h2 className="text-2xl font-bold">{(summary.avgAttendance*100).toFixed(1)}%</h2>
        </div>
        <div className="bg-white p-4 shadow rounded-xl">
          <p>평균 복습률</p>
          <h2 className="text-2xl font-bold">{(summary.avgReview*100).toFixed(1)}%</h2>
        </div>
        <div className="bg-white p-4 shadow rounded-xl">
          <p>평균 시험 점수</p>
          <h2 className="text-2xl font-bold">{summary.avgTestScore}점</h2>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-6">
        <AdminFocusLineChart />
        <AdminWeeklyAreaChart />
        <AdminResponseHistogram />
      </div>
    </div>
  );
}

export default AdminDashboard;
