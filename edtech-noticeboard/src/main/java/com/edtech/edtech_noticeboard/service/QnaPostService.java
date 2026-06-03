package com.edtech.edtech_noticeboard.service;

import com.edtech.edtech_noticeboard.dto.QnaPostDto;
import com.edtech.edtech_noticeboard.entity.QnaPost;
import com.edtech.edtech_noticeboard.repository.QnaPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class QnaPostService {

    private final QnaPostRepository qnaPostRepository;

    public QnaPost createPost(Long classId, QnaPostDto.Create dto, String authorId) {
        QnaPost post = new QnaPost();
        post.setClassId(classId);
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setAuthorId(authorId);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        return qnaPostRepository.save(post);
    }

    public Page<QnaPost> getPosts(Long classId, Pageable pageable) {
        return qnaPostRepository.findByClassId(classId, pageable);
    }

    public QnaPost getPost(Long classId, Long postId) {
        return qnaPostRepository.findByIdAndClassId(postId, classId)
                .orElseThrow(() -> new RuntimeException("게시글 없음"));
    }

    public QnaPost updatePost(Long classId, Long postId, QnaPostDto.Update dto) {
        QnaPost post = getPost(classId, postId);
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        return qnaPostRepository.save(post);
    }

    public void deletePost(Long classId, Long postId) {
        QnaPost post = getPost(classId, postId);
        qnaPostRepository.delete(post);
    }
}
