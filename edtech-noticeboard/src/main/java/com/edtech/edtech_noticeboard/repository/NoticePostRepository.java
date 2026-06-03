package com.edtech.edtech_noticeboard.repository;

import com.edtech.edtech_noticeboard.entity.NoticePost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NoticePostRepository extends JpaRepository<NoticePost, Long> {
    Page<NoticePost> findByClassId(Long classId, Pageable pageable);
    Optional<NoticePost> findByIdAndClassId(Long id, Long classId);
}
