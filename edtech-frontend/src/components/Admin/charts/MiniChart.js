import React from "react";
import { studentDetailData } from "../../../data/AdminDummyData";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";

export default function MiniChart({ type, courseId }) {
  const courseData = studentDetailData.find((c) => c.courseId === courseId);
  const students = courseData?.students || [];

  const style = { width: "100%", height: 130 };
  const gridStyle = { strokeDasharray: "3 3", stroke: "#f0f0f0" };

  /** 🔹 학생 데이터를 그룹핑 (출석/복습/집중 통일) */
  const getGroupedPreview = (metric, groupSize = 20) => {
    const totalStudents = students.length;
    if (totalStudents === 0) return [];

    const minPoints = 5;
    const dynamicGroupSize = Math.max(
      1,
      Math.floor(totalStudents / minPoints)
    );
    const finalGroupSize = Math.min(groupSize, dynamicGroupSize);
    const groups = Math.ceil(totalStudents / finalGroupSize);

    return Array.from({ length: groups }, (_, gIdx) => {
      const start = gIdx * finalGroupSize;
      const end = start + finalGroupSize;
      const slice = students.slice(start, end);

      const values = slice.map((s) => s[metric]).filter((v) => v != null);
      const avg = values.length
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;

      return {
        label: `${start + 1}~${Math.min(end, totalStudents)}번`,
        value: avg,
      };
    });
  };

  /** 🔹 평균 시험 점수 (여러 회차) */
  const getScorePreview = () => {
    const maxRounds = Math.max(...students.map((s) => s.scoreHistory?.length || 0), 0);
    return Array.from({ length: maxRounds }, (_, idx) => {
      const scores = students
        .map((s) => s.scoreHistory?.[idx] ?? null)
        .filter((v) => v != null);

      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      return { round: `${idx + 1}회차`, score: avg };
    });
  };

  /** 🔹 응답 시간 분포 (최근 회차 기준) */
  const getResponsePreview = () => {
    const bins = [0, 3, 6, 9, 12, 15];
    const lastIndex = Math.max(
      ...students.map((s) => s.responseHistory?.length || 0),
      0
    ) - 1;

    return bins.map((start, i) => {
      const end = bins[i + 1] ?? Infinity;
      const count = students.filter((s) => {
        const history = s.responseHistory;
        if (!history || history.length === 0) return false;
        const value = history[lastIndex]; // 최근 회차 응답
        return value != null && value >= start && value < end;
      }).length;

      return {
        range: end === Infinity ? `${start}+초` : `${start}~${end - 1}초`,
        count,
      };
    });
  };

  /** 🔹 평균 집중률도 그룹핑 로직으로 통일 */
  const getGroupedFocusPreview = (groupSize = 20) => {
    const totalStudents = students.length;
    if (totalStudents === 0) return [];

    const minPoints = 5;
    const dynamicGroupSize = Math.max(
      1,
      Math.floor(totalStudents / minPoints)
    );
    const finalGroupSize = Math.min(groupSize, dynamicGroupSize);
    const groups = Math.ceil(totalStudents / finalGroupSize);

    return Array.from({ length: groups }, (_, gIdx) => {
      const start = gIdx * finalGroupSize;
      const end = start + finalGroupSize;
      const slice = students.slice(start, end);

      const values = slice
        .map((s) => {
          if (!s.focusHistory || s.focusHistory.length === 0) return null;
          return s.focusHistory.reduce((a, b) => a + b, 0) / s.focusHistory.length;
        })
        .filter((v) => v != null);

      const avg = values.length
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;

      return {
        label: `${start + 1}~${Math.min(end, totalStudents)}번`,
        value: avg,
      };
    });
  };

  switch (type) {
    /** 🔹 평균 출석률 (파랑) */
    case "attendance":
      return (
        <div style={style}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getGroupedPreview("attendance", 20)}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="label" hide />
              <YAxis domain={[0, 100]} hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    /** 🔹 평균 복습률 (초록) */
    case "review":
      return (
        <div style={style}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getGroupedPreview("review", 20)}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="label" hide />
              <YAxis domain={[0, 100]} hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    /** 🔹 평균 집중률 (보라, dot 추가, 그룹화 적용) */
    case "focus":
      return (
        <div style={style}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getGroupedFocusPreview(20)}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="label" hide />
              <YAxis domain={[0, 100]} hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#A855F7"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    /** 🔹 평균 시험 점수 (막대) */
    case "score":
      return (
        <div style={style}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getScorePreview()} barSize={18}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="round" hide />
              <YAxis domain={[0, 100]} hide />
              <Bar dataKey="score" fill="#EE828C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    /** 🔹 응답 시간 분포 (막대, 최근 회차 기준) */
    case "response":
      return (
        <div style={style}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getResponsePreview()} barSize={18}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="range" hide />
              <YAxis hide />
              <Bar dataKey="count" fill="#FFC107" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    /** 🔹 주간 집중도 변화 (막대 + 라인, 최근 6주, 상향 시 빨강) */
    case "weeklyFocus":
      const maxWeeks = Math.max(...students.map((s) => s.focusHistory?.length || 0), 0);
      const allWeeklyData = Array.from({ length: maxWeeks }, (_, weekIdx) => {
        const values = students
          .map((s) => s.focusHistory?.[weekIdx])
          .filter((v) => v != null);
        const avg = values.length
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : 0;
        return { week: `${weekIdx + 1}주차`, focus: avg };
      });

      const last6 = allWeeklyData.slice(-6).map((item, idx) => {
        const actualIdx = allWeeklyData.length - 6 + idx;
        const prevFocus =
          actualIdx > 0 ? allWeeklyData[actualIdx - 1].focus : item.focus;

        return {
          ...item,
          color: item.focus > prevFocus ? "#F87171" : "#60A5FA",
        };
      });

      return (
        <div style={style}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={last6}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="week" hide />
              <YAxis domain={[0, 100]} hide />
              <Bar
                dataKey="focus"
                barSize={18}
                radius={[4, 4, 0, 0]}
                shape={(props) => {
                  const { x, y, width, height, payload } = props;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={payload.color}
                      rx={4}
                      ry={4}
                    />
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="focus"
                stroke="#1D4ED8"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );

    default:
      return <div className="text-gray-400 text-center">지원 안됨</div>;
  }
}
