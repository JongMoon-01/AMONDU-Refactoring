package com.edtech.edtech_backend.repository;

import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourseEngagementAnalyticsRepository
        extends JpaRepository<CourseEngagementAnalytics, Long> {

    @Query("""
      select a from CourseEngagementAnalytics a
      where a.classEntity.classId = :classId
        and a.courseId = :courseId
        and a.userId = :userId
      order by a.createdAt desc
    """)
    List<CourseEngagementAnalytics> findSessions(Long classId, Long courseId, String userId);

    default Optional<CourseEngagementAnalytics> findLatest(
            Long classId, Long courseId, String userId) {
        List<CourseEngagementAnalytics> list = findSessions(classId, courseId, userId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    // attentionArr size 체크 → focusDropCount > 0 으로 교체
    @Query("""
      select (count(a) > 0) from CourseEngagementAnalytics a
      where a.classEntity.classId = :classId
        and a.courseId = :courseId
        and a.userId = :userId
        and a.focusDropCount > 0
    """)
    boolean existsWithFocusDrop(Long classId, Long courseId, String userId);
}
