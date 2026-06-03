package com.edtech.edtech_noticeboard.controller;

import com.edtech.edtech_noticeboard.client.ClassAccessClient;
import com.edtech.edtech_noticeboard.dto.QnaCommentDto;
import com.edtech.edtech_noticeboard.entity.QnaComment;
import com.edtech.edtech_noticeboard.service.QnaCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes/{classId}/qna/{postId}/comments")
@RequiredArgsConstructor
public class QnaCommentController {

    private final QnaCommentService qnaCommentService;
    private final ClassAccessClient access;

    @PostMapping
    public ResponseEntity<QnaComment> add(@PathVariable Long classId,
                                          @PathVariable Long postId,
                                          @RequestBody QnaCommentDto.Create dto,
                                          Authentication auth) {
        access.assertEnrolled(auth, classId);
        String authorId = auth.getName();
        return ResponseEntity.ok(qnaCommentService.addComment(classId, postId, dto, authorId));
    }

    @GetMapping
    public ResponseEntity<List<QnaComment>> list(@PathVariable Long classId,
                                                 @PathVariable Long postId,
                                                 Authentication auth) {
        access.assertEnrolled(auth, classId);
        return ResponseEntity.ok(qnaCommentService.getComments(classId, postId));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long classId,
                                       @PathVariable Long postId,
                                       @PathVariable Long commentId,
                                       Authentication auth) {
        access.assertEnrolled(auth, classId);
        qnaCommentService.deleteComment(classId, postId, commentId);
        return ResponseEntity.ok().build();
    }
}
