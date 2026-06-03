import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceDot,
  Cell,
} from "recharts";
import { studentDetailData } from "../../../data/AdminDummyData";

export default function AdminTestScoreChart({ courseId }) {
  const [viewMode, setViewMode] = useState("all");
  const [selectedRound, setSelectedRound] = useState(null);
  const [kdeData, setKdeData] = useState({ x: [], y: [] });
  const [hoverScore, setHoverScore] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ 페이지네이션
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const courseData = studentDetailData.find((c) => c.courseId === courseId);
  const students = courseData?.students || [];

  // 🔹 모든 회차 평균 점수 계산
  const examAverages = useMemo(() => {
    if (students.length === 0) return [];
    const maxLength = Math.max(...students.map((s) => s.scoreHistory?.length || 0));

    const averages = [];
    for (let i = 0; i < maxLength; i++) {
      let sum = 0;
      let count = 0;
      students.forEach((s) => {
        const score = s.scoreHistory?.[i] ?? null;
        if (score !== null && score !== undefined) {
          sum += score;
          count++;
        }
      });
      averages.push({
        round: `${i + 1}회차`,
        avgScore: count > 0 ? Math.round(sum / count) : 0,
        count,
        rate: Math.round((count / students.length) * 100),
        index: i,
      });
    }
    return averages;
  }, [students]);

  // 🔹 페이지 단위 데이터
  const pagedData = useMemo(() => {
    const start = page * pageSize;
    return examAverages.slice(start, start + pageSize);
  }, [examAverages, page]);

  const canPrev = page > 0;
  const canNext = (page + 1) * pageSize < examAverages.length;
  const rangeTitle = `${page * pageSize + 1}~${page * pageSize + pagedData.length}회차 시험 평균`;

  // 🔹 선택 회차별 유효 학생
  const validStudents = useMemo(() => {
    if (!selectedRound) return [];
    return students.filter((s) => {
      const score = s.scoreHistory?.[selectedRound.index];
      return score !== null && score !== undefined;
    });
  }, [students, selectedRound]);

  // 🔹 점수 정렬
  const sortedStudents = useMemo(() => {
    return [...validStudents].sort((a, b) => {
      const aScore = a.scoreHistory?.[selectedRound.index] ?? 0;
      const bScore = b.scoreHistory?.[selectedRound.index] ?? 0;
      return bScore - aScore;
    });
  }, [validStudents, selectedRound]);

  // 🔹 모드별 표시 학생
  const filteredByMode = useMemo(() => {
    if (viewMode === "top10") return sortedStudents.slice(0, 10);
    if (viewMode === "bottom10") return sortedStudents.slice(-10);
    return sortedStudents;
  }, [viewMode, sortedStudents]);

  // 🔹 검색 적용
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return filteredByMode;
    return filteredByMode.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredByMode, searchQuery]);

  // 🔹 KDE 요청
  const fetchKDE = async (roundIndex) => {
    const scores = students
      .map((s) => s.scoreHistory?.[roundIndex] ?? null)
      .filter((v) => v !== null && v !== undefined);

    if (scores.length === 0) {
      setKdeData({ x: [], y: [] });
      return;
    }

    const res = await fetch("http://localhost:8000/api/admin/kde", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores }),
    });
    const data = await res.json();
    setKdeData(data);
  };

  useEffect(() => {
    if (selectedRound !== null) {
      fetchKDE(selectedRound.index);
    }
  }, [selectedRound]);

  // 🔹 Hover dot 근사치 좌표
  const getHoverPoint = () => {
    if (hoverScore === null || kdeData.x.length === 0) return null;
    let idx = kdeData.x.reduce(
      (bestIdx, curr, i) =>
        Math.abs(curr - hoverScore) < Math.abs(kdeData.x[bestIdx] - hoverScore)
          ? i
          : bestIdx,
      0
    );
    return { x: kdeData.x[idx], y: kdeData.y[idx] };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 좌측: 평균 시험점수 막대그래프 + 페이지네이션 */}
      <div className="bg-white p-6 rounded-2xl shadow flex flex-col">
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

        {pagedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pagedData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="round" tick={{ fill: "#4b5563" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#4b5563" }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border px-2 py-1 text-xs shadow">
                        <p>{label}</p>
                        <p>평균 점수: {data.avgScore}</p>
                        <p>응시자: {data.count}명 ({data.rate}%)</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="avgScore"
                onClick={(data) => {
                  setSelectedRound(data);
                  setHoverScore(null);
                }}
              >
                {pagedData.map((entry, index) => {
                  const isSelected = selectedRound && selectedRound.index === entry.index;
                  const baseColor = "#FCA5A5";     // 연핑크
                  const selectedColor = "#E75480"; // 진한 핑크
                  return (
                    <Cell key={`cell-${index}`} fill={isSelected ? selectedColor : baseColor} />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-400 text-center py-10">데이터가 없습니다.</div>
        )}

        {/* 🔹 선택 회차 KDE 차트 */}
        {selectedRound && kdeData.x.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-bold mb-2">
              {selectedRound.round} 정규분포 (결시자 제외)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={kdeData.x.map((x, i) => ({ x, y: kdeData.y[i] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tickFormatter={(v) => Math.round(v)} />
                <YAxis hide />
                <Tooltip
                  formatter={(value, name, props) => {
                    const scores = validStudents.map(
                      (s) => s.scoreHistory[selectedRound.index]
                    );
                    const lessOrEqual = scores.filter(
                      (score) => score <= props.payload.x
                    ).length;
                    const rawPercent = (lessOrEqual / scores.length) * 100;
                    const percentile =
                      Math.max(rawPercent, 100 / scores.length).toFixed(2) + "%";

                    const allStudents = validStudents
                      .filter((s) => {
                        const roundScore = s.scoreHistory?.[selectedRound.index];
                        return (
                          roundScore !== null &&
                          roundScore !== undefined &&
                          Math.abs(roundScore - props.payload.x) <= 0.5
                        );
                      })
                      .map((s) => s.name);

                    const maxDisplay = 5;
                    const displayList = allStudents.slice(0, maxDisplay).join(", ");
                    const tooltipText =
                      allStudents.length > maxDisplay
                        ? `${displayList} 외 ${allStudents.length - maxDisplay}명`
                        : displayList || "해당 없음";

                    return [
                      <span style={{ color: "blue", fontWeight: "bold" }}>{percentile}</span>,
                      tooltipText,
                    ];
                  }}
                  labelFormatter={(label) => `점수: ${Math.round(label)}`}
                />
                <Line type="monotone" dataKey="y" stroke="#ff7300" dot={false} />
                {getHoverPoint() && (
                  <ReferenceDot
                    x={getHoverPoint().x}
                    y={getHoverPoint().y}
                    r={5}
                    fill="red"
                    isFront
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 우측: 학생 테이블 */}
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
                  {selectedRound ? `${selectedRound.round} 점수` : "점수"}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student, index) => {
                const roundScore = student.scoreHistory?.[selectedRound.index];
                return (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onMouseEnter={() => {
                      if (
                        selectedRound &&
                        roundScore !== null &&
                        roundScore !== undefined
                      ) {
                        setHoverScore(roundScore);
                      }
                    }}
                    onMouseLeave={() => setHoverScore(null)}
                  >
                    <td className="px-2 py-1">{student.name}</td>
                    <td className="px-2 py-1 text-right font-bold text-gray-800">
                      {roundScore}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
