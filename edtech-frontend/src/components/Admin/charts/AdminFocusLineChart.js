import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts";

export default function AdminFocusLineChart({ data, metric, hoveredId }) {
  const totalStudents = data?.length || 0;

  // ✅ groupSize 동적 계산
  const groupSize = useMemo(() => {
    if (totalStudents <= 15) return totalStudents;
    if (totalStudents <= 30) return 5;
    if (totalStudents <= 100) return Math.ceil(totalStudents / 6);
    return Math.ceil(totalStudents / 10);
  }, [totalStudents]);

  const [viewMode, setViewMode] = useState(totalStudents <= 15 ? "detail" : "summary");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const groups = [];
    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize);
      const avgValue = group.reduce((sum, s) => sum + (s[metric] ?? 0), 0) / group.length;
      groups.push({
        groupLabel: `${group[0].id}~${group[group.length - 1].id}번`,
        avgValue: Number(avgValue.toFixed(2)),
        groupData: group,
      });
    }
    return groups;
  }, [data, metric, groupSize]);

  const summaryChartData = groupedData.map((g) => ({
    label: g.groupLabel,
    value: g.avgValue,
  }));

  const detailChartData =
    selectedGroup ? selectedGroup.groupData : totalStudents <= 15 ? data : [];

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setViewMode("detail");
  };

  const handleBackToSummary = () => {
    setSelectedGroup(null);
    setViewMode("summary");
  };

  const hoveredStudent = useMemo(() => {
    if (!hoveredId) return null;

    if (viewMode === "detail" && selectedGroup) {
      return selectedGroup.groupData.find((s) => s.id === hoveredId) || null;
    }

    return data.find((s) => s.id === hoveredId) || null;
  }, [hoveredId, viewMode, selectedGroup, data]);

  // ✅ metric에 따라 색상 지정
  const getLineColor = (metric) => {
    switch (metric) {
      case "attendance":
        return "#3B82F6"; // 파랑
      case "review":
        return "#22C55E"; // 초록
      case "focus":
        return "#A855F7"; // 보라
      default:
        return "#8884d8"; // 기본
    }
  };

  const color = getLineColor(metric);

  return (
    <div className="w-full h-80">
      {viewMode === "detail" && totalStudents > 15 && (
        <button
          onClick={handleBackToSummary}
          className="mb-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← 요약으로 돌아가기
        </button>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={viewMode === "summary" ? summaryChartData : detailChartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          onClick={
            viewMode === "summary"
              ? (state) => {
                  if (state && state.activeLabel) {
                    const group = groupedData.find(
                      (g) => g.groupLabel === state.activeLabel
                    );
                    if (group) handleGroupClick(group);
                  }
                }
              : undefined
          }
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={viewMode === "summary" ? "label" : "id"}
            tick={{ fontSize: 12, angle: 0 }}
            interval={0}
            tickFormatter={(value, index) => (index % 2 === 0 ? value : "")}
            label={{ value: "학생번호", position: "insideBottom", dy: 20 }}
          />
          <YAxis domain={[0, 100]} />

          <Tooltip
            formatter={(value, name, props) => {
              const studentScore = props.payload.score ?? value;
              return `${studentScore}`;
            }}
            labelFormatter={(label, payload) => {
              if (viewMode === "summary") return `${label} 평균`;
              const student = payload[0]?.payload;
              return student ? student.name : `학생 ${label}`;
            }}
          />

          <Line
            type="monotone"
            dataKey={viewMode === "summary" ? "value" : metric}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
          />

          {hoveredStudent && (
            <>
              <ReferenceDot
                x={hoveredStudent.id}
                y={hoveredStudent[metric] ?? hoveredStudent.value}
                r={4}
                fill="red"
                stroke="none"
              />
              <ReferenceLine
                x={hoveredStudent.id}
                stroke="red"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={hoveredStudent[metric] ?? hoveredStudent.value}
                stroke="red"
                strokeDasharray="3 3"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
