// utils/chartDataHelper.js

/**
 * 시간대별 평균 집중도 계산
 */
export const calculateHourlyFocus = (data) => {
  const hourMap = {};
  data.forEach((row) => {
    const { hour, focus_score } = row;
    if (!hourMap[hour]) hourMap[hour] = [];
    hourMap[hour].push(focus_score);
  });

  return Object.entries(hourMap).map(([hour, scores]) => ({
    hour: Number(hour),
    avgFocus: (
      scores.reduce((a, b) => a + b, 0) / scores.length
    ).toFixed(2),
  }));
};

/**
 * 주간 평균 집중도 (요일 기준) 계산
 */
export const calculateWeeklyFocus = (data) => {
  const weekMap = {};
  data.forEach((row) => {
    const { week, focus_score } = row;
    if (!weekMap[week]) weekMap[week] = [];
    weekMap[week].push(focus_score);
  });

  return Object.entries(weekMap).map(([week, scores]) => ({
    week: Number(week),
    avgFocus: (
      scores.reduce((a, b) => a + b, 0) / scores.length
    ).toFixed(2),
  }));
};

/**
 * 응답 시간 히스토그램 데이터 변환
 */
export const calculateResponseHistogram = (data) => {
  const bins = Array(10).fill(0); // 0~10 구간
  data.forEach((row) => {
    const { response_time } = row;
    const idx = Math.min(Math.floor(response_time), 9);
    bins[idx]++;
  });

  return bins.map((count, idx) => ({
    range: `${idx}-${idx + 1}초`,
    count,
  }));
};

/**
 * KPI 요약 계산
 */
export const calculateKpiSummary = (classSummaryData) => {
  const total = classSummaryData.length || 1;

  const avgAttendance = (
    (classSummaryData.reduce((acc, c) => acc + (c.avgAttendance || 0), 0) / total) *
    100
  ).toFixed(1);

  const avgReview = (
    (classSummaryData.reduce((acc, c) => acc + (c.avgReview || 0), 0) / total) * 100
  ).toFixed(1);

  const avgFocus = (
    (classSummaryData.reduce((acc, c) => acc + (c.avgFocus || 0), 0) / total) * 100
  ).toFixed(1);

  const avgScore = (
    classSummaryData.reduce((acc, c) => acc + (c.avgTestScore || 0), 0) / total
  ).toFixed(1);

  return { avgAttendance, avgReview, avgFocus, avgScore };
};

/**
 * KPI metricValue 계산
 */
export function calculateMetricValue(student, metric) {
  switch (metric) {
    case "attendance":
      return (student.attendance || 0) * 100;
    case "review":
      return (student.review || 0) * 100;
    case "focus":
      return (student.focus || 0) * 100;
    case "score":
      return student.testScore || 0;
    case "responseTime":
      return student.responseTime || 0;
    case "weeklyFocus":
      return student.weeklyFocus || 0;
    default:
      return 0;
  }
}

/**
 * KPI용 학생 데이터 정제
 */
export function generateStudentMetricData(students, metric) {
  return (students || []).map((s) => ({
    ...s,
    metricValue: Number(calculateMetricValue(s, metric)),
  }));
}

// 🔹 과목 단위 KPI 요약 계산 함수
export function calculateClassKpiSummary(students) {
  const total = students.length || 1;
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);

  // 🔹 이미 0~100 단위라면 *100 제거
  const avgAttendance = Math.round(sum(students.map(s => s.attendance || 0)) / total);
  const avgReview = Math.round(sum(students.map(s => s.review || 0)) / total);
  const avgFocus = Math.round(sum(students.map(s => s.focus || 0)) / total);

   // ✅ 최신 회차 점수 평균
  const avgScore = Math.round(
    sum(
      students.map(s => {
        if (Array.isArray(s.scores)) {
          return s.scores[s.scores.length - 1] || 0; // 마지막 회차
        }
        return s.score || 0; // 단일 점수
      })
    ) / total
  );

  return { avgAttendance, avgReview, avgFocus, avgScore };
}

/**
 * 24주차 주간 평균 집중도 계산 (디버깅용 로그 추가)
 */
export function calculateWeeklyFocus24(students) {
  console.log("📊 [calculateWeeklyFocus24] 호출됨");
  console.log("학생 수:", students.length);
  console.log("샘플 학생:", students[0]);
  console.log("첫 학생 focusHistory:", students[0]?.focusHistory);

  const weeks = 24;
  const result = [];

  for (let w = 0; w < weeks; w++) {
    let sum = 0;
    let count = 0;
    students.forEach((s) => {
      if (Array.isArray(s.focusHistory) && s.focusHistory[w] != null) {
        sum += s.focusHistory[w];
        count++;
      }
    });
    const avg = count > 0 ? Math.round(sum / count) : 0;
    result.push({ week: `${w + 1}주차`, focus: avg });
  }

  console.log("계산된 주간 평균:", result);
  return result;
}
