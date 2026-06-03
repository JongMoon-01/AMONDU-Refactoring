package com.edtech.edtech_backend.repository;

import com.edtech.edtech_backend.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SummaryRepository extends JpaRepository<Summary, Long> {
    List<Summary> findByLecture_LectureId(Long lectureId);
    List<Summary> findByUserId(String userId);
}
