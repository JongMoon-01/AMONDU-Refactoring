package com.edtech.edtech_noticeboard.controller;

import com.edtech.edtech_noticeboard.client.ClassAccessClient;
import com.edtech.edtech_noticeboard.dto.NoticePostDto;
import com.edtech.edtech_noticeboard.entity.NoticePost;
import com.edtech.edtech_noticeboard.service.NoticePostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/classes/{classId}/notices")
@RequiredArgsConstructor
public class NoticePostController {

    private final NoticePostService service;
    private final ClassAccessClient access;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NoticePost> create(
        @PathVariable Long classId,
        @RequestParam("title") String title,
        @RequestParam("content") String content,
        @RequestPart(value = "file", required = false) MultipartFile file,
        Authentication auth
    ) {
    access.assertEnrolled(auth, classId);
    String authorId = auth.getName();

    System.out.println("[create] title=" + title
            + ", contentLen=" + (content != null ? content.length() : null)
            + ", file=" + (file != null ? file.getOriginalFilename() : null));

    NoticePostDto.Create dto = new NoticePostDto.Create();
    dto.setTitle(title);
    dto.setContent(content);
    dto.setFile(file);

    NoticePost saved = service.createPost(classId, dto, authorId);
    return ResponseEntity
            .created(java.net.URI.create("/api/classes/" + classId + "/notices/" + saved.getId()))
            .body(saved);
    }


    

    @GetMapping
    public ResponseEntity<Page<NoticePost>> list(
            @PathVariable Long classId,
            Pageable pageable,
            Authentication auth
    ) {
        access.assertEnrolled(auth, classId);
        return ResponseEntity.ok(service.getPosts(classId, pageable));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<NoticePost> detail(
            @PathVariable Long classId,
            @PathVariable Long postId,
            Authentication auth
    ) {
        access.assertEnrolled(auth, classId);
        return ResponseEntity.ok(service.getPostDetail(classId, postId));
    }

    @PutMapping(value = "/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<NoticePost> update(
        @PathVariable Long classId,
        @PathVariable Long postId,
        @RequestParam("title") String title,
        @RequestParam("content") String content,
        @RequestPart(value = "file", required = false) MultipartFile file, // 선택 업로드
        Authentication auth
) {
    access.assertEnrolled(auth, classId);

    // 서비스에 넘길 DTO 조립
    NoticePostDto.Update dto = new NoticePostDto.Update();
    dto.setTitle(title);
    dto.setContent(content);
    dto.setFile(file);

    return ResponseEntity.ok(service.updatePost(classId, postId, dto));
}

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long classId,
            @PathVariable Long postId,
            Authentication auth
    ) {
        access.assertEnrolled(auth, classId);
        service.deletePost(classId, postId);
        return ResponseEntity.ok().build();
    }
}
