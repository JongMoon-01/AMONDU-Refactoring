package com.edtech.edtech_noticeboard.repository;

import com.edtech.edtech_noticeboard.entity.QnaPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QnaPostRepository extends JpaRepository<QnaPost, Long> {
    Page<QnaPost> findByClassId(Long classId, Pageable pageable);
    Optional<QnaPost> findByIdAndClassId(Long id, Long classId);
}
