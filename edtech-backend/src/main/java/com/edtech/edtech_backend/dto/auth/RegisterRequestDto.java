// src/main/java/com/edtech/edtech_backend/dto/auth/RegisterRequestDto.java
package com.edtech.edtech_backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor
public class RegisterRequestDto {
    @NotBlank private String name;
    @Email @NotBlank private String email;
    @NotBlank private String password;

    @NotBlank private String phone;    // ✅ 추가
    @NotBlank private String role;     // ✅ "STUDENT" 또는 "ADMIN" 문자열로 받음
}
