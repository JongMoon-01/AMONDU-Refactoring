// src/main/java/com/edtech/edtech_backend/dto/CourseSummaryDto.java
package com.edtech.edtech_backend.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class CourseSummaryDto {
    private Long courseId;
    private String title;
    private String instructor;
    private String materialUrl;
    private String tag;
}
