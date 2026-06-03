// src/main/java/com/edtech/edtech_backend/controller/FocusController.java
package com.edtech.edtech_backend.controller;

import com.edtech.edtech_backend.dto.FocusDto;
import com.edtech.edtech_backend.entity.ClassEntity;
import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import com.edtech.edtech_backend.entity.FocusInterval;
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
import java.util.Collections;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/focus")
@RequiredArgsConstructor
public class FocusController {

    private final ClassRepository classRepository;
    private final CourseEngagementAnalyticsRepository analyticsRepository;

    @PostMapping("/intervals")
    public ResponseEntity<FocusDto.SaveResponse> saveIntervals(
            Authentication authentication,                 // ✅ 인증객체 통째로 받기
            @RequestBody FocusDto.SessionPayload payload
    ) {
        // 0) 인증 확인 + userId 추출
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 필요");
        }
        String userId = resolveUserId(authentication);
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유저 식별 불가");
        }

        CourseEngagementAnalytics entity = new CourseEngagementAnalytics();

        // 1) classId -> ClassEntity
        if (payload.getClassId() != null) {
            ClassEntity clazz = classRepository.findById(payload.getClassId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId not found: " + payload.getClassId()));
            entity.setClassEntity(clazz);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classId 누락");
        }

        // 2) 필드 세팅 (userId는 프론트값 무시하고 인증값 사용)
        entity.setCourseId(payload.getCourseId());
        entity.setUserId(userId);

        if (payload.getStartedAt() != null) {
            entity.setStartedAt(Instant.ofEpochMilli(payload.getStartedAt()));
        }
        if (payload.getEndedAt() != null) {
            entity.setEndedAt(Instant.ofEpochMilli(payload.getEndedAt()));
        }
        entity.setTotalDurationSec(payload.getTotalDurationSec());

        // 3) intervals 매핑
        if (payload.getIntervals() != null && !payload.getIntervals().isEmpty()) {
            entity.setAttentionArr(
                    payload.getIntervals().stream().map(ip -> {
                        FocusInterval fi = new FocusInterval();
                        fi.setStartAt(Instant.ofEpochMilli(ip.getStart()));
                        fi.setEndAt(Instant.ofEpochMilli(ip.getEnd()));
                        fi.setDurationSec(ip.getDurationSec());
                        fi.setAvgScore(ip.getAvgScore());
                        return fi;
                    }).collect(Collectors.toList())
            );
        }

        Long id = analyticsRepository.save(entity).getCourseAnalyticsId();
        return ResponseEntity.ok(new FocusDto.SaveResponse(id));
    }

     @GetMapping("/intervals/latest")
    public ResponseEntity<FocusDto.SessionView> getLatest(
            Authentication authentication,
            @RequestParam Long classId,
            @RequestParam Long courseId
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 필요");
        }
        String userId = resolveUserId(authentication);

        var opt = analyticsRepository.findLatest(classId, courseId, userId);

        FocusDto.SessionView view = new FocusDto.SessionView();
        if (opt.isEmpty()) {
            // 비어있는 JSON으로 200 반환 (프론트에서 안전하게 처리 가능)
            view.setStartedAt(null);
            view.setEndedAt(null);
            view.setTotalDurationSec(null);
            view.setIntervals(Collections.emptyList());
            return ResponseEntity.ok(view);
        }

        var cea = opt.get();
        view.setStartedAt(toEpoch(cea.getStartedAt()));
        view.setEndedAt(toEpoch(cea.getEndedAt()));
        view.setTotalDurationSec(cea.getTotalDurationSec());
        view.setIntervals(
                (cea.getAttentionArr() == null ? Collections.<FocusInterval>emptyList() : cea.getAttentionArr())
                        .stream()
                        .map(fi -> {
                            FocusDto.IntervalPayload p = new FocusDto.IntervalPayload();
                            p.setStart(toEpoch(fi.getStartAt()));
                            p.setEnd(toEpoch(fi.getEndAt()));
                            p.setDurationSec(fi.getDurationSec());
                            p.setAvgScore(fi.getAvgScore());
                            return p;
                        })
                        .collect(Collectors.toList())
        );
        return ResponseEntity.ok(view);
    }
     private Long toEpoch(Instant t) { return (t == null) ? null : t.toEpochMilli(); }

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
