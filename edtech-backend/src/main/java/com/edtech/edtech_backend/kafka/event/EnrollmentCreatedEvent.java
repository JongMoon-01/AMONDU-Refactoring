package com.edtech.edtech_backend.kafka.event;

/**
 * enrollment.created 토픽 이벤트
 * Producer: edtech-backend (수강신청 완료 시)
 * Consumer: attention-model-fastapi-service (세션 준비)
 */
public record EnrollmentCreatedEvent(
        Long userId,
        Long classId,
        String userEmail,
        long enrolledAt   // epoch ms
) {}
