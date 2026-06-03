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

export default function AdminResponseHistogram({ courseId }) {
  const [viewMode, setViewMode] = useState("all");
  const [selectedRound, setSelectedRound] = useState(null);
  const [kdeData, setKdeData] = useState({ x: [], y: [] });
  const [hoverScore, setHoverScore] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const courseData = studentDetailData.find((c) => c.courseId === courseId);
  const students = courseData?.students || [];

  // 🔹 회차별 평균 응답시간 계산 (결시자 제외)
  const responseAverages = useMemo(() => {
    if (students.length === 0) return [];
    const maxLength = Math.max(...students.map((s) => s.responseHistory?.length || 0));

    return Array.from({ length: maxLength }, (_, i) => {
      const valid = students
        .map((s) => s.responseHistory?.[i])
        .filter((v) => v != null);
      const sum = valid.reduce((a, b) => a + b, 0);
      const count = valid.length;
      return {
        round: `${i + 1}회차`,
        avgResponse: count > 0 ? Math.round(sum / count) : 0,
        count,
        rate: Math.round((count / students.length) * 100),
        index: i,
      };
    });
  }, [students]);

  const pagedData = useMemo(() => {
    const start = page * pageSize;
    return responseAverages.slice(start, start + pageSize);
  }, [responseAverages, page]);

  const canPrev = page > 0;
  const canNext = (page + 1) * pageSize < responseAverages.length;
  const rangeTitle = `${page * pageSize + 1}~${page * pageSize + pagedData.length}회차 응답시간 평균`;

  // 🔹 선택 회차별 유효 학생
  const validStudents = useMemo(() => {
    if (!selectedRound) return [];
    return students.filter((s) => s.responseHistory?.[selectedRound.index] != null);
  }, [students, selectedRound]);

  const sortedStudents = useMemo(() => {
    return [...validStudents].sort((a, b) => {
      const aScore = a.responseHistory?.[selectedRound.index] ?? 0;
      const bScore = b.responseHistory?.[selectedRound.index] ?? 0;
      return aScore - bScore;
    });
  }, [validStudents, selectedRound]);

  const displayedStudents = useMemo(() => {
    let list = sortedStudents;
    if (viewMode === "top10") list = sortedStudents.slice(0, 10);
    if (viewMode === "bottom10") list = sortedStudents.slice(-10);
    if (searchQuery.trim()) {
      list = list.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [sortedStudents, viewMode, searchQuery]);

  // 🔹 KDE 요청 (결시자 제외)
  const fetchKDE = async (roundIndex) => {
    const scores = students
      .map((s) => s.responseHistory?.[roundIndex])
      .filter((v) => v != null);

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
    if (selectedRound) fetchKDE(selectedRound.index);
  }, [selectedRound]);

  const getHoverPoint = () => {
    if (hoverScore == null || kdeData.x.length === 0) return null;
    let idx = kdeData.x.reduce(
      (best, curr, i) =>
        Math.abs(curr - hoverScore) < Math.abs(kdeData.x[best] - hoverScore) ? i : best,
      0
    );
    return { x: kdeData.x[idx], y: kdeData.y[idx] };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 좌측: 막대그래프 */}
      <div className="bg-white p-6 rounded-2xl shadow flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => canPrev && setPage(page - 1)} disabled={!canPrev}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-30">◀</button>
          <h2 className="text-lg font-bold">{rangeTitle}</h2>
          <button onClick={() => canNext && setPage(page + 1)} disabled={!canNext}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-30">▶</button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pagedData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis dataKey="round" tick={{ fill: "#4b5563" }} />
            <YAxis domain={[0, 18]} tick={{ fill: "#4b5563" }} />
            <Tooltip content={({ active, payload, label }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border px-2 py-1 text-xs shadow">
                    <p>{label}</p>
                    <p>평균 응답시간: {data.avgResponse}초</p>
                    <p>응답자: {data.count}명 ({data.rate}%)</p>
                  </div>
                );
              }
              return null;
            }} />
            <Bar dataKey="avgResponse" onClick={(data) => { setSelectedRound(data); setHoverScore(null); }}>
              {pagedData.map((entry, index) => {
                const isSelected = selectedRound && selectedRound.index === entry.index;
                return <Cell key={index} fill={isSelected ? "#FFB300" : "#FFE082"} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* 🔹 KDE 정규분포 */}
        {selectedRound && kdeData.x.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-bold mb-2">{selectedRound.round} 응답시간 정규분포 (결시자 제외)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={kdeData.x.map((x, i) => ({ x, y: kdeData.y[i] })).filter(d => d.x <= 18)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" domain={[0, 18]} type="number" tickFormatter={(v) => Math.round(v)} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip labelFormatter={(label) => `응답시간: ${Math.round(label)}초`} />
                <defs>
                  <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFB300" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#FFB300" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="y" stroke="#FFB300" strokeWidth={2} dot={false} fillOpacity={1} fill="url(#yellowGradient)" />
                {getHoverPoint() && (
                  <ReferenceDot x={getHoverPoint().x} y={getHoverPoint().y} r={5} fill="red" isFront />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 우측 학생 리스트 */}
      <div className="bg-white p-6 rounded-2xl shadow flex flex-col">
        <h2 className="text-lg font-bold mb-4">학생 리스트 (응답시간 기준)</h2>
        <div className="flex gap-2 mb-3 justify-between items-center">
          <div className="space-x-2">
            <button className={`px-3 py-1 rounded ${viewMode === "all" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setViewMode("all")}>전체</button>
            <button className={`px-3 py-1 rounded ${viewMode === "top10" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setViewMode("top10")}>상위 10명</button>
            <button className={`px-3 py-1 rounded ${viewMode === "bottom10" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setViewMode("bottom10")}>하위 10명</button>
          </div>
          <input type="text" placeholder="학생 검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border rounded px-2 py-1 w-32 focus:outline-none" />
        </div>
        <div className="overflow-y-auto max-h-[450px] border rounded">
          <table className="table-auto w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left">학생</th>
                <th className="px-2 py-1 text-right">{selectedRound ? `${selectedRound.round} 응답` : "응답시간(초)"}</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student, index) => {
                const roundScore = student.responseHistory?.[selectedRound?.index ?? 0] ?? null;
                return (
                  <tr key={index} className="hover:bg-gray-50 cursor-pointer"
                    onMouseEnter={() => roundScore != null && setHoverScore(roundScore)}
                    onMouseLeave={() => setHoverScore(null)}>
                    <td className="px-2 py-1">{student.name}</td>
                    <td className="px-2 py-1 text-right font-bold text-gray-800">{roundScore ?? "-"}</td>
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
