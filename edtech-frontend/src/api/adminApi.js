import {
  classSummaryData,
  studentPerformanceData,
} from "../data/AdminDummyData";

/**
 * 모든 과목 목록 가져오기
 */
export const fetchClasses = () => {
  return classSummaryData.map((c) => ({
    classId: c.classId,
    className: c.className,
  }));
};

/**
 * 특정 과목 KPI 요약 데이터 가져오기
 */
export const fetchClassKpi = (classId) => {
  return classSummaryData.find((c) => c.classId === classId) || null;
};

/**
 * 특정 과목의 학생별 상세 성과 데이터 가져오기
 */
export const fetchStudentPerformance = (classId) => {
  return studentPerformanceData.filter((s) => s.classId === classId);
};