package com.edtech.edtech_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Setter @Getter
@Entity
@Table(name = "course_engagement_analytics")
public class CourseEngagementAnalytics {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_analytics_id")
    private Long courseAnalyticsId;

    @ManyToOne @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "user_email")
    private String userId;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "total_duration_sec")
    private Integer totalDurationSec;

    // ③ attentionArr(JSON[]) 제거 → 집계 컬럼으로 교체
    // avgFocusScore: 집중 안함 구간들의 평균 집중도 (0.0 ~ 1.0)
    @Column(name = "avg_focus_score")
    private Float avgFocusScore;

    // focusDropCount: 집중 안함 구간 개수
    @Column(name = "focus_drop_count")
    private Integer focusDropCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
