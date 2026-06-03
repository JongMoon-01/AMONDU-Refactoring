package com.edtech.edtech_noticeboard.service;

import com.edtech.edtech_noticeboard.dto.NoticePostDto;
import com.edtech.edtech_noticeboard.entity.NoticePost;
import com.edtech.edtech_noticeboard.repository.NoticePostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoticePostService {

    private final NoticePostRepository noticePostRepository;
    private final FileStorageService fileStorage;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public NoticePost createPost(Long classId, NoticePostDto.Create dto, String authorId) {
        NoticePost post = new NoticePost();
        post.setClassId(classId);
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setAuthorId(authorId);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        String saved = saveIfPresent(dto.getFile());
        if (saved != null) post.setFileName(saved);

        return noticePostRepository.save(post);
    }

    public Page<NoticePost> getPosts(Long classId, Pageable pageable) {
        return noticePostRepository.findByClassId(classId, pageable);
    }

    public NoticePost getPostDetail(Long classId, Long postId) {
        return noticePostRepository.findByIdAndClassId(postId, classId)
                .orElseThrow(() -> new RuntimeException("게시글 없음"));
    }

    public NoticePost updatePost(Long classId, Long postId, NoticePostDto.Update dto) {
        NoticePost post = getPostDetail(classId, postId);
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setUpdatedAt(LocalDateTime.now());

        String saved = saveIfPresent(dto.getFile());
        if (saved != null) post.setFileName(saved);

        return noticePostRepository.save(post);
    }

    public void deletePost(Long classId, Long postId) {
    NoticePost post = noticePostRepository.findByIdAndClassId(postId, classId)
            .orElseThrow(() -> new RuntimeException("공지글 없음"));
    noticePostRepository.delete(post);
    }

    private String saveIfPresent(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        return fileStorage.save(file);
    }
}
