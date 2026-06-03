package com.edtech.edtech_noticeboard.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class ClassAccessClient {

    @Value("${backend.base-url}")
    private String backend;

    // 매 요청마다 토큰이 달라서 빌더만 재사용
    private RestClient client() {
        return RestClient.builder()
                .baseUrl(backend)
                .build();
    }

    public void assertEnrolled(Authentication auth, Long classId) {
        String token = ((JwtAuthenticationToken) auth).getToken().getTokenValue();

        try {
            Set<Long> enrolled = client().get()
                    .uri("/api/classes/me/enrollments")
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Set<Long>>() {});
            if (enrolled == null || !enrolled.contains(classId)) {
                throw new AccessDeniedException("not enrolled");
            }
        } catch (HttpStatusCodeException ex) {
            HttpStatusCode sc = ex.getStatusCode();
            // 4xx/5xx를 보기 좋게 변환
            throw new AccessDeniedException("enroll check failed: " + sc.value());
        }
    }
}
