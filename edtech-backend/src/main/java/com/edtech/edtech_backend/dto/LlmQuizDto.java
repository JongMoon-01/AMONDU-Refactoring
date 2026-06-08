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

    // ③ 퀴즈 생성 요청 시 프론트에서 intervals 직접 전달
    // (attentionArr을 DB에서 읽지 않으므로 클라이언트가 보유한 intervals 사용)
    @Data
    public static class GenerateRequest {
        private List<IntervalDto> intervals;
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
        private String label;
        private String text;
    }

    @Data
    public static class QuizItemDto {
        private String question;
        private List<OptionDto> options;
        private String answer;
        private String type;
    }
}
