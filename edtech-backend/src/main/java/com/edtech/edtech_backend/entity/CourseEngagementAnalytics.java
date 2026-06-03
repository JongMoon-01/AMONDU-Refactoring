// src/main/java/com/edtech/edtech_backend/entity/CourseEngagementAnalytics.java
package com.edtech.edtech_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Setter @Getter
@Entity
@Table(name = "course_engagement_analytics")
public class CourseEngagementAnalytics {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_analytics_id")
    private Long courseAnalyticsId;

    // 필요하면 유지, 없으면 제거
    @ManyToOne @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    // 프론트 payload에 맞춰 단순 보존
    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "user_email")
    private String userId;

    // 세션 메타
    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "total_duration_sec")
    private Integer totalDurationSec;

    // 구간 리스트
   @ElementCollection
@CollectionTable(
    name = "focus_intervals",
    joinColumns = @JoinColumn(name = "course_analytics_id")
)
private List<FocusInterval> attentionArr = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
