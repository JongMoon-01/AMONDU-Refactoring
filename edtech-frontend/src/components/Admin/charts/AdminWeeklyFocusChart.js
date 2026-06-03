import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AdminWeeklyFocusChart({ students = [], weeklyData = [] }) {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [viewMode, setViewMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;

  // 🔹 주간 평균 집중도 계산
  const averagedWeeklyData = useMemo(() => {
    return weeklyData.map((_, weekIdx) => {
      const focusValues = students
        .map((s) => s.focusHistory?.[weekIdx])
        .filter((v) => v !== null && v !== undefined);
      const avg =
        focusValues.length > 0
          ? Math.round(focusValues.reduce((a, b) => a + b, 0) / focusValues.length)
          : 0;
      return {
        week: `${weekIdx + 1}주차`,
        focus: avg,
        index: weekIdx,
      };
    });
  }, [students, weeklyData]);

  // 🔹 페이지 단위 데이터
  const pagedData = useMemo(() => {
    const start = page * pageSize;
    return averagedWeeklyData.slice(start, start + pageSize);
  }, [averagedWeeklyData, page]);

  // 🔹 학생 리스트
  const selectedStudents = useMemo(() => {
    if (selectedWeek === null) return [];
    return students.map((s) => ({
      name: s.name,
      focus: s.focusHistory?.[selectedWeek.index] ?? null,
    }));
  }, [students, selectedWeek]);

  const sortedStudents = useMemo(() => {
    return [...selectedStudents].filter((s) => s.focus !== null).sort((a, b) => b.focus - a.focus);
  }, [selectedStudents]);

  const filteredByMode = useMemo(() => {
    if (viewMode === "top10") return sortedStudents.slice(0, 10);
    if (viewMode === "bottom10") return sortedStudents.slice(-10);
    return sortedStudents;
  }, [viewMode, sortedStudents]);

  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return filteredByMode;
    return filteredByMode.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredByMode, searchQuery]);

  // 🔹 KPI 계산
  const focusValues = pagedData.map((d) => d.focus).filter((v) => v !== null && v !== undefined);
  const avg = focusValues.length
    ? (focusValues.reduce((sum, v) => sum + v, 0) / focusValues.length).toFixed(1)
    : 0;
  const maxVal = focusValues.length ? Math.max(...focusValues) : 0;
  const minVal = focusValues.length ? Math.min(...focusValues) : 0;

  const prevPageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return averagedWeeklyData.slice(start, start + pageSize);
  }, [averagedWeeklyData, page]);

  const prevValues = prevPageData.map((d) => d.focus).filter((v) => v !== null && v !== undefined);
  const prevAvg = prevValues.length
    ? prevValues.reduce((sum, v) => sum + v, 0) / prevValues.length
    : avg;
  const diff = (avg - prevAvg).toFixed(1);

  const canPrev = page > 0;
  const canNext = (page + 1) * pageSize < averagedWeeklyData.length;
  const rangeTitle = `${page * pageSize + 1}~${page * pageSize + pagedData.length}주차 주간 집중도`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* 좌측: 주간 집중도 + KPI 카드 */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => canPrev && setPage(page - 1)}
            disabled={!canPrev}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-30"
          >
            ◀
          </button>
          <h2 className="text-lg font-bold">{rangeTitle}</h2>
          <button
            onClick={() => canNext && setPage(page + 1)}
            disabled={!canNext}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-30"
          >
            ▶
          </button>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={pagedData}
              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value) => [`평균 집중도: ${value}`, ""]} // 한 줄만 표시
              />

              {/* 🔹 막대: 클릭 시 진하게 */}
              <Bar
                dataKey="focus"
                barSize={30}
                onClick={(data) => {
                  if (data && data.payload) {
                    setSelectedWeek(data.payload);
                  }
                }}
              >
                {pagedData.map((entry, index) => {
                  const prev = index > 0 ? pagedData[index - 1].focus : entry.focus;
                  const isUp = entry.focus > prev;
                  const isSelected = selectedWeek && selectedWeek.index === entry.index;
                  const baseColor = isUp ? "#F87171" : "#60A5FA"; // 파스텔톤
                  const selectedColor = isUp ? "#EF4444" : "#3B82F6"; // 조금 더 진한색
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isSelected ? selectedColor : baseColor}
                    />
                  );
                })}
              </Bar>

              <Line
                type="monotone"
                dataKey="focus"
                stroke="#60A5FA" // 🔹 라인 연파랑
                strokeWidth={2}
                dot={({ cx, cy, payload, index }) => {
                  const prev = index > 0 ? pagedData[index - 1].focus : payload.focus;
                  const isUp = payload.focus > prev;
                  const isSelected = selectedWeek && selectedWeek.index === payload.index;
                  const baseColor = isUp ? "#F87171" : "#60A5FA";
                  const selectedColor = isUp ? "#EF4444" : "#3B82F6";
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={isSelected ? selectedColor : baseColor}
                      stroke="#fff"
                      strokeWidth={1}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedWeek(payload)}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* KPI 카드 (차트 아래) */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-gray-500 text-sm mb-1">평균 집중률</div>
            <div className="text-2xl font-bold text-blue-600">{avg}%</div>
            <div className={`text-sm ${diff >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)}%
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-gray-500 text-sm mb-1">최고 / 최저</div>
            <div className="text-xl font-bold text-blue-600">
              {maxVal}% / {minVal}%
            </div>
          </div>
        </div>
      </div>

      {/* 우측: 학생 리스트 */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-col">
        <h2 className="text-lg font-bold mb-4">
          {selectedWeek ? `${selectedWeek.week} 학생 집중도` : "학생 리스트"}
        </h2>

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
                  {selectedWeek ? selectedWeek.week : "집중도"}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-2 py-1">{student.name}</td>
                  <td className="px-2 py-1 text-right font-bold text-gray-800">
                    {student.focus ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
