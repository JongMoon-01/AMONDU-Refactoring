package com.edtech.edtech_noticeboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notice_post")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NoticePost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long classId;   // ★ FK 숫자만
    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String content;

    private String authorId;                          // 작성자 ID
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String fileName;                          // 첨부파일명(옵션)
}
