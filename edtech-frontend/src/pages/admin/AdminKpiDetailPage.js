import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import AdminFocusLineChart from "../../components/Admin/charts/AdminFocusLineChart";
import AdminTestScoreChart from "../../components/Admin/charts/AdminTestScoreChart";
import AdminResponseHistogram from "../../components/Admin/charts/AdminResponseHistogram"; 
import AdminWeeklyFocusChart from "../../components/Admin/charts/AdminWeeklyFocusChart"; 
import { classSummaryData, studentDetailData } from "../../data/AdminDummyData";
import { calculateWeeklyFocus24 } from "../../utils/chartDataHelper"; 
import "../../App.css";

function AdminKpiDetailPage() {
  const { classId, courseId, metric } = useParams();
  const metricKey = metric;
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [sortedStudents, setSortedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(metricKey || "attendance");
  const [hoveredId, setHoveredId] = useState(null); 
  const [viewMode, setViewMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); 

  const subjectInfo = classSummaryData.find((data) => data.id === courseId);
  const selectedSubject = subjectInfo?.name || "";

  useEffect(() => {
    setSelectedMetric(metricKey || "attendance");
  }, [metricKey]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    const subjectData = studentDetailData.find((data) => data.courseId === courseId);

    if (subjectData) {
      setStudents(subjectData.students);

      const metric = selectedMetric || "attendance";
      const sortKey = metric === "response" ? "responseTime" : metric;
      setSortedStudents(
        [...subjectData.students].sort((a, b) => b[sortKey] - a[sortKey])
      );
    } else {
      setStudents([]);
      setSortedStudents([]);
    }

    setLoading(false);
  }, [courseId, selectedMetric]);

  if (loading) return <div className="p-6 text-center">데이터를 불러오는 중...</div>;

  const displayedStudents =
    viewMode === "top10"
      ? sortedStudents.slice(0, 10)
      : viewMode === "bottom10"
      ? sortedStudents.slice(-10)
      : sortedStudents;

  const filteredStudents = displayedStudents.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const metricTitleMap = {
    attendance: "평균 출석률",
    review: "평균 복습률",
    focus: "평균 집중률",
    score: "평균 시험 점수",
    response: "응답 시간 분포",
    weeklyFocus: "주간 집중도 변화",
  };

  const metricTitle = metricTitleMap[selectedMetric] || "KPI 상세";
  const showKpiButtons = ["attendance", "review", "focus"].includes(selectedMetric);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">

        <main className="flex-1 p-6 space-y-6">
          <button
            onClick={() => navigate(`/class/${classId}/adminDashboard/kpi/${courseId}`)}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            ← KPI 요약으로
          </button>

          {showKpiButtons && (
            <div className="flex gap-4 mb-4">
              <button
                className={`px-4 py-2 rounded ${
                  selectedMetric === "attendance" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => navigate(`/class/${classId}/adminDashboard/kpi/${courseId}/attendance`)}
              >
                평균 출석률
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  selectedMetric === "review" ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => navigate(`/class/${classId}/adminDashboard/kpi/${courseId}/review`)}
              >
                평균 복습률
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  selectedMetric === "focus" ? "bg-purple-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => navigate(`/class/${classId}/adminDashboard/kpi/${courseId}/focus`)}
              >
                평균 집중률
              </button>
            </div>
          )}

          {selectedMetric === "attendance" || selectedMetric === "review" || selectedMetric === "focus" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow">
                <h2 className="text-lg font-bold mb-4">
                  {selectedSubject} - {metricTitle} 그래프
                </h2>
                {students.length > 0 ? (
                  <AdminFocusLineChart 
                    data={students} 
                    metric={selectedMetric} 
                    hoveredId={hoveredId} 
                  />
                ) : (
                  <div className="text-gray-400 text-center py-10">데이터가 없습니다.</div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow flex flex-col">
                <h2 className="text-lg font-bold mb-4">학생 리스트</h2>

                <div className="flex gap-2 mb-3 justify-between items-center">
                  <div className="space-x-2">
                    <button
                      className={`px-3 py-1 rounded ${viewMode === "all" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                      onClick={() => setViewMode("all")}
                    >
                      전체
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${viewMode === "top10" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                      onClick={() => setViewMode("top10")}
                    >
                      상위 10명
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${viewMode === "bottom10" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                      onClick={() => setViewMode("bottom10")}
                    >
                      하위 10명
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="학생 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border rounded px-2 py-1 w-32 focus:outline-none"
                  />
                </div>

                <div className="overflow-y-auto max-h-[450px] border rounded">
                  <table className="table-auto w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">학생</th>
                        <th className="px-2 py-1 text-right">
                          {selectedMetric === "response" ? "응답시간(초)" : "점수"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr
                          key={index}
                          onMouseEnter={() => setHoveredId(student.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-2 py-1">{student.name}</td>
                          <td className="px-2 py-1 text-right font-bold text-gray-800">
                            {selectedMetric === "response" ? student.responseTime : student[selectedMetric]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : selectedMetric === "score" ? (
            <AdminTestScoreChart courseId={courseId} />
          ) : selectedMetric === "response" ? (
            <AdminResponseHistogram courseId={courseId} />
          ) : selectedMetric === "weeklyFocus" ? (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-lg font-bold mb-4">{selectedSubject} - 주간 집중도 변화</h2>
              <AdminWeeklyFocusChart 
                weeklyData={calculateWeeklyFocus24(students)} 
                students={students} 
              />
            </div>
          ) : (
            <div className="text-center text-gray-500">지원하지 않는 KPI입니다.</div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminKpiDetailPage;
