package com.edtech.edtech_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CourseResponseDto {
    private Long courseId;
    private String title;
    private String instructor;
    private String tag;        // "필수,온라인" 같은 콤마 문자열
}