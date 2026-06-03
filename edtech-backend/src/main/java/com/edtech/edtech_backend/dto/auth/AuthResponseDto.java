package com.edtech.edtech_backend.dto.auth;

public class AuthResponseDto {
    private final String token;
    private final Long userId;
    private final String name;
    private final String email;
    private final String role;

    public AuthResponseDto(String token, Long userId, String name, String email, String role) {
        this.token = token; this.userId = userId; this.name = name; this.email = email; this.role = role;
    }
    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
