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
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizLlmGatewayService quizLlmGatewayService;

    // ③ 프론트에서 intervals 직접 전달 (attentionArr DB 조회 제거)
    @PostMapping("/classes/{classId}/courses/{courseId}/generate")
    public ResponseEntity<List<LlmQuizDto.QuizItemDto>> generate(
            @PathVariable Long classId,
            @PathVariable Long courseId,
            Authentication auth,
            @RequestBody LlmQuizDto.GenerateRequest body
    ) {
        String userId = resolveUserId(auth);
        var items = quizLlmGatewayService.generateFromIntervals(
                classId, courseId, userId, body.getIntervals());
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
