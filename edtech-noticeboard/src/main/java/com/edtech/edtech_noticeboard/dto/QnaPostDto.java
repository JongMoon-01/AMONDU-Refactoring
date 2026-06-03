package com.edtech.edtech_noticeboard.dto;

import lombok.Data;

public class QnaPostDto {
    @Data public static class Create { private String title; private String content; }
    @Data public static class Update { private String title; private String content; }
}
