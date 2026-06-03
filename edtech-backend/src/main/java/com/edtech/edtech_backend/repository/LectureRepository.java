package com.edtech.edtech_backend.repository;

import com.edtech.edtech_backend.entity.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LectureRepository extends JpaRepository<Lecture, Long> {
    Optional<Lecture> findByLectureId(Long lectureId);
}
