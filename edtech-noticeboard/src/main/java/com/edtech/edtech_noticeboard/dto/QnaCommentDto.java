package com.edtech.edtech_noticeboard.dto;

import lombok.Data;

public class QnaCommentDto {
    @Data
    public static class Create {
        private String content;
    }
}
