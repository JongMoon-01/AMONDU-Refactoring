package com.edtech.edtech_backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

public class FocusDto {

    @Getter @Setter
    public static class IntervalPayload {
        private Long start;          // epoch ms
        private Long end;            // epoch ms
        private Integer durationSec;
        private Double avgScore;
    }

    @Getter @Setter
    public static class SessionPayload {
        private Long classId;
        private Long courseId;
        private String userId;       // 무시 — 인증값 사용
        private Long startedAt;      // epoch ms
        private Long endedAt;        // epoch ms
        private Integer totalDurationSec;
        private List<IntervalPayload> intervals;
    }

    @Getter @Setter
    public static class SaveResponse {
        private Long analyticsId;
        public SaveResponse(Long id) { this.analyticsId = id; }
    }

    // ③ SessionView(intervals 반환) → AnalyticsView(집계값 반환)로 교체
    @Getter @Setter
    public static class AnalyticsView {
        private Long startedAt;          // epoch ms
        private Long endedAt;            // epoch ms
        private Integer totalDurationSec;
        private Float avgFocusScore;     // 집중 안함 구간 평균 집중도
        private Integer focusDropCount;  // 집중 안함 구간 개수
    }
}
