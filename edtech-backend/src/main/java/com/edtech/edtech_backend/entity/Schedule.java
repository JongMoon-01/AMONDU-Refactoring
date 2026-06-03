package com.edtech.edtech_backend.entity;

import jakarta.persistence.*;

@Entity
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scheduleId;

    private String title;
    private String downloadUrl;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    // Getters
    public Long getScheduleId() { return scheduleId; }
    public String getTitle() { return title; }
    public String getDownloadUrl() { return downloadUrl; }
    public Course getCourse() { return course; }
}
