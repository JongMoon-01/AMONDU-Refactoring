// AdminDummyData.js

export const classSummaryData = [
  { id: "math", name: "수학", studentCount: 200 },
  { id: "english", name: "영어", studentCount: 10 },
  { id: "science", name: "과학", studentCount: 16 },
];

// ✅ 강의별 학생 상세 데이터
export const studentDetailData = [
  {
    courseId: "math",
    students: Array.from({ length: 200 }, (_, i) => {
      const minScore = 50;
      const maxScore = 100;
      const examCount = Math.floor(Math.random() * 2) + 5; // 5~6회
      const difficulty = [-5, 0, 2, -3, 4, -2]; // 난이도 계수
      const skipRate = 0.15; // 결시율 15%

      // 시험 점수 히스토리
      const scoreHistory = Array.from({ length: examCount }, (_, idx) => {
        if (Math.random() < skipRate) return null;
        const rawScore =
          Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
        return Math.min(
          maxScore,
          Math.max(minScore, rawScore + (difficulty[idx] || 0))
        );
      });

      const validScores = scoreHistory.filter((v) => v != null);
      const avgScore = validScores.length
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;

      return {
        id: i + 1,
        name: `수학학생${i + 1}`,
        attendance: Math.floor(Math.random() * 21) + 75,
        review: Math.floor(Math.random() * 21) + 65,
        focus: Math.floor(Math.random() * 21) + 70,
        attendanceHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 75),
        reviewHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 65),
        focusHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 70),
        score: avgScore,
        scoreHistory,
        responseTime: Math.floor(Math.random() * 15) + 1,
        responseHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 15) + 1), // ✅ 추가
      };
    }),
  },
  {
    courseId: "english",
    students: Array.from({ length: 10 }, (_, i) => {
      const minScore = 50;
      const maxScore = 100;
      const examCount = Math.floor(Math.random() * 2) + 5;
      const difficulty = [-4, 1, -2, 3, -1, 2];
      const skipRate = 0.15;

      const scoreHistory = Array.from({ length: examCount }, (_, idx) => {
        if (Math.random() < skipRate) return null;
        const rawScore =
          Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
        return Math.min(
          maxScore,
          Math.max(minScore, rawScore + (difficulty[idx] || 0))
        );
      });

      const validScores = scoreHistory.filter((v) => v != null);
      const avgScore = validScores.length
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;

      return {
        id: i + 1,
        name: `영어학생${i + 1}`,
        attendance: Math.floor(Math.random() * 21) + 70,
        review: Math.floor(Math.random() * 21) + 60,
        focus: Math.floor(Math.random() * 21) + 65,
        attendanceHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 70),
        reviewHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 60),
        focusHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 65),
        score: avgScore,
        scoreHistory,
        responseTime: Math.floor(Math.random() * 15) + 1,
        responseHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 15) + 1), // ✅ 추가
      };
    }),
  },
  {
    courseId: "science",
    students: Array.from({ length: 16 }, (_, i) => {
      const minScore = 50;
      const maxScore = 100;
      const examCount = Math.floor(Math.random() * 2) + 5;
      const difficulty = [0, 3, -4, 2, -1, 1];
      const skipRate = 0.15;

      const scoreHistory = Array.from({ length: examCount }, (_, idx) => {
        if (Math.random() < skipRate) return null;
        const rawScore =
          Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
        return Math.min(
          maxScore,
          Math.max(minScore, rawScore + (difficulty[idx] || 0))
        );
      });

      const validScores = scoreHistory.filter((v) => v != null);
      const avgScore = validScores.length
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;

      return {
        id: i + 1,
        name: `과학학생${i + 1}`,
        attendance: Math.floor(Math.random() * 21) + 70,
        review: Math.floor(Math.random() * 21) + 60,
        focus: Math.floor(Math.random() * 21) + 65,
        attendanceHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 70),
        reviewHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 60),
        focusHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 21) + 65),
        score: avgScore,
        scoreHistory,
        responseTime: Math.floor(Math.random() * 15) + 1,
        responseHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 15) + 1), // ✅ 추가
      };
    }),
  },
];
