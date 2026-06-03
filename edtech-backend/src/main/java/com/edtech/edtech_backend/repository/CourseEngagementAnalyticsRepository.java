package com.edtech.edtech_backend.repository;

import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourseEngagementAnalyticsRepository
        extends JpaRepository<CourseEngagementAnalytics, Long> {

    // createdAt DESC로 최신 1건 — 파생 메서드 대신 @Query + default로 안전하게
    @Query("""
      select a from CourseEngagementAnalytics a
      where a.classEntity.classId = :classId
        and a.courseId = :courseId
        and a.userId = :userId
      order by a.createdAt desc
    """)
    List<CourseEngagementAnalytics> findSessions(Long classId, Long courseId, String userId);

    default Optional<CourseEngagementAnalytics> findLatest(Long classId, Long courseId, String userId) {
        List<CourseEngagementAnalytics> list = findSessions(classId, courseId, userId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("""
      select (count(a) > 0) from CourseEngagementAnalytics a
      where a.classEntity.classId = :classId
        and a.courseId = :courseId
        and a.userId = :userId
        and size(a.attentionArr) > 0
    """)
    boolean existsByClassIdAndCourseIdAndUserIdAndAttentionArrNotEmpty(
            Long classId, Long courseId, String userId
    );
}
