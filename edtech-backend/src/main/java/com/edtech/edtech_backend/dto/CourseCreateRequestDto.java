// src/main/java/com/edtech/edtech_backend/dto/CourseCreateRequestDto.java
package com.edtech.edtech_backend.dto;
import lombok.Getter;

@Getter
public class CourseCreateRequestDto {
    private String title;
    private String instructor;     // 선택
    private String tag;            // "스마트,필수" 처럼 저장
    private String materialUrl;    // 자료 URL (선택)
}
