// src/main/java/com/edtech/edtech_backend/dto/FocusDto.java
package com.edtech.edtech_backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

public class FocusDto {

    @Getter @Setter
    public static class IntervalPayload {
        private Long start;       // epoch ms
        private Long end;         // epoch ms
        private Integer durationSec;
        private Double avgScore;
    }

    @Getter @Setter
    public static class SessionPayload {
        private Long classId;     // 1
        private Long courseId;    // 1
        private String userId;    // "user123"
        private Long startedAt;   // epoch ms
        private Long endedAt;     // epoch ms
        private Integer totalDurationSec; // 43
        private List<IntervalPayload> intervals; // size=2
    }

    @Getter @Setter
    public static class SaveResponse {
        private Long analyticsId;
        public SaveResponse(Long id) { this.analyticsId = id; }
    }

    @Getter @Setter
    public static class LatestView {
    private Instant startedAt;            // ISO로 내려감 (프론트 toMs 처리)
    private List<IntervalView> intervals;
    }

    @Getter @Setter
    public static class IntervalView {
    private long start;                   // epoch ms
    private long end;                     // epoch ms
    private Integer durationSec;
    private Double avgScore;
    }

    @Getter @Setter
    public static class SessionView {
        private Long startedAt;   // epoch ms (null 가능)
        private Long endedAt;     // epoch ms (옵션)
        private Integer totalDurationSec;
        private List<IntervalPayload> intervals; // 비어있을 수 있음
    }
}
