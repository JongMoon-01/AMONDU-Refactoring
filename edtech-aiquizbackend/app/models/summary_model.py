# Summary 테이블 제거됨 (리팩터링)
# aiquiz DB는 edtech.Summary.summaryId를 참조만 함 (Database per Service 패턴)
# 요약 원본 데이터는 edtech-backend가 단독 관리
#
# 기존: Summary(summary_id, lecture_id, user_id, content, time, created_at) → aiquiz DB 저장
# 변경: AIQuiz.summary_id(BigInteger) → edtech.Summary.summaryId 논리적 참조만
