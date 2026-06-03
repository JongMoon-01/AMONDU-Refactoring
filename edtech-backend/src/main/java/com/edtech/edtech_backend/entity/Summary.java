package com.edtech.edtech_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Summary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long summaryId;

    @ManyToOne
    @JoinColumn(name = "lecture_id")
    private Lecture lecture;

    private String userId; // 외래키만 쓰고 User entity 제거했으므로

    @Column(columnDefinition = "TEXT")
    private String content;

    private int time; // 집중한 시간 (초 단위 추정)

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    // Getters
    public Long getSummaryId() { return summaryId; }
    public Lecture getLecture() { return lecture; }
    public String getUserId() { return userId; }
    public String getContent() { return content; }
    public int getTime() { return time; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
