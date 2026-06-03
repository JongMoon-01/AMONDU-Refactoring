// src/data/dummyData.js

export const erdDummyData = {
  user: {
    user_id: 1,
    name: "김지현",
    email: "jihyun@edtech.com",
    role: "student",
  },
  class: {
    class_id: 10,
    title: "에이블스쿨 7기",
    taq: "AI반",
    headcount: 30,
  },
  course: {
    course_id: 101,
    class_id: 10,
    title: "딥러닝 기초",
    material_url: "https://example.com/material.pdf",
  },
  lecture: {
    lecture_id: 1001,
    course_id: 101,
    title: "딥러닝 기초 1강",
    video_url: "https://example.com/video1.mp4",
    created_at: "2025-07-20T10:00:00Z",
  },
  summary: {
    summary_id: 5001,
    lecture_id: 1001,
    user_id: 1,
    content: "00:03~00:06 집중 안함 - 역전파 이해 어려움",
    time: "00:03~00:06",
    created_at: "2025-07-20T10:15:00Z",
  },
  quiz: {
    question_id: 7001,
    summary_id: 5001,
    user_id: 1,
    quiz_type: "short_answer",
    quiz_text: "역전파는 어떤 역할을 하나요?",
    answer_text: "오차를 기반으로 가중치를 조정한다.",
    created_at: "2025-07-20T10:20:00Z",
  },
  courseEngagementAnalytics: {
    course_analytics_id: 9001,
    lecture_id: 1001,
    user_id: 1,
    focus_score: 72.5,
    reaction_time_avg: 1.84,
    attention_graph_data: [0.8, 0.85, 0.6, 0.9, 0.95],
    created_at: "2025-07-20T10:30:00Z",
  },
  userEngagementAnalytics: {
    analytics_id: 9901,
    user_id: 1,
    lecture_id: 1001,
    attention_timeline: [0.92, 0.81, 0.68, 0.95, 0.88],
    missed_sections: {
      "00:03~00:05": "Low Focus",
    },
    category_bar_data: {
      "영상": 15,
      "텍스트": 10,
      "오디오": 5,
    },
    llm_summary: "이번 강의는 역전파와 손실함수의 개념을 다룸",
    focus_score_avg: 76.2,
    reaction_time_avg: 1.74,
    attendance_rate: 0.93,
    created_at: "2025-07-20T10:40:00Z",
  },
};

// 🔹 카드용 단순 수치 데이터
export const attendanceRate = Math.round(
  erdDummyData.userEngagementAnalytics.attendance_rate * 100
); // 93
export const reviewRate = 87; // 예시
export const focusAverage = Math.round(
  erdDummyData.userEngagementAnalytics.focus_score_avg
); // 76

// 🔹 시간대별 집중도 → focusTimeData
export const focusTimeData = erdDummyData.courseEngagementAnalytics.attention_graph_data.map(
  (value, index) => ({
    time: `${8 + index * 2}시`,
    score: Math.round(value * 100),
  })
);

// 🔹 응답속도 차트 → responseData
export const responseData = [
  { time: "1s", score: 5 },
  { time: "2s", score: 10 },
  { time: "3s", score: 7 },
  { time: "4s", score: 3 },
  { time: "5s", score: 2 },
  { time: "6s", score: 1 },
];

// 🔹 주간 집중도 변화 → weeklyFocusData
export const weeklyFocusData = [
  { week: "1주차", score: -2 },
  { week: "2주차", score: 5 },
  { week: "3주차", score: -1 },
  { week: "4주차", score: 7 },
];

// 🔹 주간 시험 점수 → weeklyTestData
export const weeklyTestData = [
  { week: "1주차", score: 75 },
  { week: "2주차", score: 85 },
  { week: "3주차", score: 82 },
  { week: "4주차", score: 88 },
  { week: "5주차", score: 98 },
];
