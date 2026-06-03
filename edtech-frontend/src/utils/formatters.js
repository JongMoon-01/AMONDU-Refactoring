/**
 * 백분율 변환
 */
export const formatPercent = (num) => `${(num * 100).toFixed(1)}%`;

/**
 * 소수점 2자리 초 단위 포맷
 */
export const formatSeconds = (num) => `${num.toFixed(2)}초`;

/**
 * 정수 자리수 포맷 (3자리 콤마)
 */
export const formatNumber = (num) =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * 날짜 포맷 (YYYY-MM-DD → YYYY.MM.DD)
 */
export const formatDate = (dateStr) => dateStr.replace(/-/g, ".");