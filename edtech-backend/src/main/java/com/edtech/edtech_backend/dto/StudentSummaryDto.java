// src/main/java/com/edtech/edtech_backend/dto/StudentSummaryDto.java
package com.edtech.edtech_backend.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class StudentSummaryDto {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String enrolledAt; // 문자열로 간단히 (원하면 LocalDateTime)
}
