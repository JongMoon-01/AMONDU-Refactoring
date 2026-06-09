package com.edtech.edtech_backend.kafka.event;

/**
 * attention.score.measured 토픽 이벤트
 * Producer: attention-model-fastapi-service (분석 완료 시)
 * Consumer: edtech-backend (CourseEngagementAnalytics 업데이트)
 */
public record AttentionScoreMeasuredEvent(
        String userId,          // edtech user email
        Long classId,
        Long courseId,
        float avgFocusScore,
        int focusDropCount,
        float finalScore,
        long measuredAt         // epoch ms
) {}
