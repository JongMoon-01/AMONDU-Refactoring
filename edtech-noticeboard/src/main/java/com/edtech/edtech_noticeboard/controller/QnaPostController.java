package com.edtech.edtech_noticeboard.controller;

import com.edtech.edtech_noticeboard.client.ClassAccessClient;
import com.edtech.edtech_noticeboard.dto.QnaPostDto;
import com.edtech.edtech_noticeboard.entity.QnaPost;
import com.edtech.edtech_noticeboard.service.QnaPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classes/{classId}/qna")
@RequiredArgsConstructor
public class QnaPostController {

    private final QnaPostService qnaPostService;
    private final ClassAccessClient access;

    @PostMapping
    public ResponseEntity<QnaPost> createPost(@PathVariable Long classId,
                                              @RequestBody QnaPostDto.Create dto,
                                              Authentication auth) {
        access.assertEnrolled(auth, classId);
        String authorId = auth.getName();
        return ResponseEntity.ok(qnaPostService.createPost(classId, dto, authorId));
    }

    @GetMapping
    public ResponseEntity<Page<QnaPost>> getPosts(@PathVariable Long classId,
                                                  Pageable pageable,
                                                  Authentication auth) {
        access.assertEnrolled(auth, classId);
        return ResponseEntity.ok(qnaPostService.getPosts(classId, pageable));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<QnaPost> getPost(@PathVariable Long classId,
                                           @PathVariable Long postId,
                                           Authentication auth) {
        access.assertEnrolled(auth, classId);
        return ResponseEntity.ok(qnaPostService.getPost(classId, postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<QnaPost> updatePost(@PathVariable Long classId,
                                              @PathVariable Long postId,
                                              @RequestBody QnaPostDto.Update dto,
                                              Authentication auth) {
        access.assertEnrolled(auth, classId);
        return ResponseEntity.ok(qnaPostService.updatePost(classId, postId, dto));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long classId,
                                           @PathVariable Long postId,
                                           Authentication auth) {
        access.assertEnrolled(auth, classId);
        qnaPostService.deletePost(classId, postId);
        return ResponseEntity.ok().build();
    }
}
