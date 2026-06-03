package com.edtech.edtech_noticeboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "qna_post")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QnaPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long classId;   // ★ FK 숫자만
    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String content;

    private String authorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "qnaPost", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QnaComment> comments = new ArrayList<>();
}
