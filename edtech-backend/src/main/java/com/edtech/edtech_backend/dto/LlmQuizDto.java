// src/main/java/com/edtech/edtech_backend/dto/LlmQuizDto.java
package com.edtech.edtech_backend.dto;

import lombok.Data;
import java.util.List;

public class LlmQuizDto {

    @Data
    public static class IntervalDto {
        private long start;
        private long end;
        private int durationSec;
        private double avgScore;
    }

    @Data
    public static class LlmQuizRequest {
        private Long classId;
        private Long courseId;
        private Long lectureId;
        private String userId;
        private String vttText;
        private List<IntervalDto> intervals;
    }

    @Data
    public static class OptionDto {
        private String label; // A/B/C/D or O/X
        private String text;
    }

    @Data
    public static class QuizItemDto {
        private String question;
        private List<OptionDto> options;
        private String answer; // 정답 라벨
        private String type;   // "MCQ" | "OX" (선택)
    }
}
