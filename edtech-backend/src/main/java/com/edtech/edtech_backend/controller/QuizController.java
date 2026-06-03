package com.edtech.edtech_backend.controller;

import com.edtech.edtech_backend.dto.LlmQuizDto;
import com.edtech.edtech_backend.service.QuizLlmGatewayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes") // ✅ 클래스 레벨
@RequiredArgsConstructor
public class QuizController {

    private final QuizLlmGatewayService quizLlmGatewayService;

    @PostMapping("/classes/{classId}/courses/{courseId}/generate") // ✅ 메서드 레벨
    public ResponseEntity<List<LlmQuizDto.QuizItemDto>> generate(
            @PathVariable Long classId,
            @PathVariable Long courseId,
            Authentication auth
    ) {
        String userId = resolveUserId(auth);
        var items = quizLlmGatewayService.generateFromIntervals(classId, courseId, userId);
        return ResponseEntity.ok(items);
    }

    private String resolveUserId(Authentication auth) {
        if (auth == null) return null;
        Object p = auth.getPrincipal();
        if (p instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            return (email != null && !email.isBlank()) ? email : jwt.getSubject();
        }
        return auth.getName();
    }
}
