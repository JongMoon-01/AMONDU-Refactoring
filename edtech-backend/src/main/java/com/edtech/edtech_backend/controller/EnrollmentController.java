package com.edtech.edtech_backend.controller;

import com.edtech.edtech_backend.entity.*;
import com.edtech.edtech_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class EnrollmentController {

  private final UserRepository userRepo;
  private final ClassRepository classRepo;
  private final EnrollmentRepository enrollRepo;

  // 학생/관리자 모두 신청 가능하게. 필요하면 hasRole('STUDENT')로 좁혀도 됨
  @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
  @PostMapping("/{classId}/enroll")
  public ResponseEntity<Void> enroll(@PathVariable Long classId, Authentication auth) {
    String email = (String) auth.getPrincipal();
    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    ClassEntity clazz = classRepo.findById(classId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    var existing = enrollRepo.findByUserAndClazz(user, clazz);
    if (existing.isPresent()) {
      // 이미 있으면 멱등 처리
      if (existing.get().getStatus() != Enrollment.Status.APPROVED) {
        existing.get().setStatus(Enrollment.Status.APPROVED);
        enrollRepo.save(existing.get());
      }
      return ResponseEntity.noContent().build(); // 204
    }

    Enrollment e = new Enrollment();
    e.setUser(user);
    e.setClazz(clazz);
    e.setStatus(Enrollment.Status.APPROVED); // 자동 승인
    enrollRepo.save(e);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  // 내가 신청한 클래스 ID 목록
  @PreAuthorize("isAuthenticated()")
  @GetMapping("/me/enrollments")
  public ResponseEntity<java.util.Set<Long>> myEnrollments(Authentication auth) {
    String email = (String) auth.getPrincipal();
    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    var ids = enrollRepo.findByUser(user).stream()
        .filter(en -> en.getStatus() == Enrollment.Status.APPROVED)
        .map(en -> en.getClazz().getClassId())
        .collect(java.util.stream.Collectors.toSet());
    return ResponseEntity.ok(ids);
  }

  // (선택) 신청 취소
  @PreAuthorize("isAuthenticated()")
  @DeleteMapping("/{classId}/enroll")
  public ResponseEntity<Void> cancel(@PathVariable Long classId, Authentication auth) {
    String email = (String) auth.getPrincipal();
    User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    ClassEntity clazz = classRepo.findById(classId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    enrollRepo.findByUserAndClazz(user, clazz).ifPresent(enrollRepo::delete);
    return ResponseEntity.noContent().build();
  }
}
