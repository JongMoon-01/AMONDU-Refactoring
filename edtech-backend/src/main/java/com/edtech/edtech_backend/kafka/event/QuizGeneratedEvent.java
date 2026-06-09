package com.edtech.edtech_backend.kafka.event;

/**
 * quiz.generated 토픽 이벤트
 * Producer: edtech-aiquizbackend (퀴즈 생성 완료 시)
 * Consumer: edtech-backend (로그 / 알림용)
 */
public record QuizGeneratedEvent(
        String userId,
        Long classId,
        Long courseId,
        Long lectureId,
        int quizCount,
        long generatedAt        // epoch ms
) {}
