package com.edtech.edtech_backend.controller;

import com.edtech.edtech_backend.dto.FocusDto;
import com.edtech.edtech_backend.entity.ClassEntity;
import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import com.edtech.edtech_backend.repository.ClassRepository;
import com.edtech.edtech_backend.repository.CourseEngagementAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/focus")
@RequiredArgsConstructor
public class FocusController {

    private final ClassRepository classRepository;
    private final CourseEngagementAnalyticsRepository analyticsRepository;

    @PostMapping("/intervals")
    public ResponseEntity<FocusDto.SaveResponse> saveIntervals(
            Authentication authentication,
            @RequestBody FocusDto.SessionPayload payload
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 필요");
        }
        String userId = resolveUserId(authentication);
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유저 식별 불가");
        }

        CourseEngagementAnalytics entity = new CourseEngagementAnalytics();

        if (payload.getClassId() != null) {
            ClassEntity clazz = classRepository.findById(payload.getClassId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "classId not found: " + payload.getClassId()));
            entity.setClassEntity(clazz);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId 누락");
        }

        entity.setCourseId(payload.getCourseId());
        entity.setUserId(userId);

        if (payload.getStartedAt() != null) {
            entity.setStartedAt(Instant.ofEpochMilli(payload.getStartedAt()));
        }
        if (payload.getEndedAt() != null) {
            entity.setEndedAt(Instant.ofEpochMilli(payload.getEndedAt()));
        }
        entity.setTotalDurationSec(payload.getTotalDurationSec());

        // ③ attentionArr 저장 대신 집계값 계산
        List<FocusDto.IntervalPayload> intervals = payload.getIntervals();
        if (intervals != null && !intervals.isEmpty()) {
            double avg = intervals.stream()
                    .filter(ip -> ip.getAvgScore() != null)
                    .mapToDouble(FocusDto.IntervalPayload::getAvgScore)
                    .average()
                    .orElse(0.0);
            entity.setAvgFocusScore((float) avg);
            entity.setFocusDropCount(intervals.size());
        } else {
            entity.setAvgFocusScore(null);
            entity.setFocusDropCount(0);
        }

        Long id = analyticsRepository.save(entity).getCourseAnalyticsId();
        return ResponseEntity.ok(new FocusDto.SaveResponse(id));
    }

    // ③ GET /intervals/latest → 집계값(avgFocusScore, focusDropCount) 반환
    @GetMapping("/intervals/latest")
    public ResponseEntity<FocusDto.AnalyticsView> getLatest(
            Authentication authentication,
            @RequestParam Long classId,
            @RequestParam Long courseId
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 필요");
        }
        String userId = resolveUserId(authentication);

        FocusDto.AnalyticsView view = new FocusDto.AnalyticsView();
        analyticsRepository.findLatest(classId, courseId, userId).ifPresent(cea -> {
            view.setStartedAt(toEpoch(cea.getStartedAt()));
            view.setEndedAt(toEpoch(cea.getEndedAt()));
            view.setTotalDurationSec(cea.getTotalDurationSec());
            view.setAvgFocusScore(cea.getAvgFocusScore());
            view.setFocusDropCount(cea.getFocusDropCount());
        });
        return ResponseEntity.ok(view);
    }

    private Long toEpoch(Instant t) {
        return (t == null) ? null : t.toEpochMilli();
    }

    private String resolveUserId(Authentication auth) {
        Object p = auth.getPrincipal();
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            return (email != null && !email.isBlank()) ? email : jwt.getSubject();
        }
        if (p instanceof String s) return s;
        return auth.getName();
    }
}
