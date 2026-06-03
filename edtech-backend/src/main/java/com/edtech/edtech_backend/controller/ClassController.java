package com.edtech.edtech_backend.controller;

import com.edtech.edtech_backend.dto.ClassRegisterRequestDto;
import com.edtech.edtech_backend.dto.ClassSummaryDto;
import com.edtech.edtech_backend.entity.ClassEntity;
import com.edtech.edtech_backend.repository.ClassRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassRepository classRepository;

    // 관리자만 생성
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ClassEntity> create(@Valid @RequestBody ClassRegisterRequestDto dto) {
        ClassEntity e = new ClassEntity();
        e.setTitle(dto.getTitle());
        e.setTag(dto.getTag());
        e.setHeadcount(dto.getHeadcount());
        ClassEntity saved = classRepository.save(e);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 공개 목록: 요약 DTO로만 반환
    @GetMapping
    public List<ClassSummaryDto> list() {
        return classRepository.findAll().stream()
                .map(c -> new ClassSummaryDto(c.getClassId(), c.getTitle(), c.getHeadcount()))
                .toList();
    }

    // (선택) 상세 조회가 필요하면 경로 분리
    @GetMapping("/{id}")
    public ResponseEntity<ClassEntity> getOne(@PathVariable Long id) {
        return classRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
