package com.edtech.edtech_backend.dto;

import com.edtech.edtech_backend.entity.Lecture;

import java.time.LocalDateTime;
import java.util.Optional;

public class LectureResponseDto {

    private Long id;
    private String title;
    private String mpdUrl;
    private String vttUrl;
    private LocalDateTime createdAt;

    public LectureResponseDto(Lecture lecture) {
        this.id = lecture.getLectureId();
        this.title = Optional.ofNullable(lecture.getTitle()).orElse("제목 없음");
        this.mpdUrl = Optional.ofNullable(lecture.getMpdPath()).orElse("");
        this.vttUrl = Optional.ofNullable(lecture.getVttPath()).orElse("");
        this.createdAt = lecture.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getMpdUrl() {
        return mpdUrl;
    }

    public String getVttUrl() {
        return vttUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
