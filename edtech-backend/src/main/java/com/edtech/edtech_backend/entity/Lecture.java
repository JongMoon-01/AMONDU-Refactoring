package com.edtech.edtech_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
public class Lecture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lectureId;

    private String title;

    private String mpdPath;
    private String vttPath;

    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "lecture")
    private Course course;
    
    @PrePersist
    public void prePersist() {
    if (this.createdAt == null) {
        this.createdAt = LocalDateTime.now();
    }
}
}
