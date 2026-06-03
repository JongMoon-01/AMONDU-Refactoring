package com.edtech.edtech_noticeboard.service;

import com.edtech.edtech_noticeboard.dto.QnaCommentDto;
import com.edtech.edtech_noticeboard.entity.QnaComment;
import com.edtech.edtech_noticeboard.entity.QnaPost;
import com.edtech.edtech_noticeboard.repository.QnaCommentRepository;
import com.edtech.edtech_noticeboard.repository.QnaPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QnaCommentService {

    private final QnaPostRepository qnaPostRepository;
    private final QnaCommentRepository qnaCommentRepository;

    public QnaComment addComment(Long classId, Long postId, QnaCommentDto.Create dto, String authorId) {
        QnaPost post = qnaPostRepository.findByIdAndClassId(postId, classId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        QnaComment c = new QnaComment();
        c.setQnaPost(post);
        c.setAuthorId(authorId);
        c.setContent(dto.getContent());
        c.setCreatedAt(LocalDateTime.now());
        return qnaCommentRepository.save(c);
    }

    public List<QnaComment> getComments(Long classId, Long postId) {
        QnaPost post = qnaPostRepository.findByIdAndClassId(postId, classId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return qnaCommentRepository.findByQnaPost(post);
    }

    public void deleteComment(Long classId, Long postId, Long commentId) {
        // classId/postId 일치 검증
        qnaPostRepository.findByIdAndClassId(postId, classId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        qnaCommentRepository.deleteById(commentId);
    }
}
