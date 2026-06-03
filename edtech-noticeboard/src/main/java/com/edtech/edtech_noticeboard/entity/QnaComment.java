package com.edtech.edtech_noticeboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "qna_comment")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QnaComment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "qna_post_id")
    private QnaPost qnaPost;

    private String authorId;                 // ← setAuthor가 아니라 authorId 사용
    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt;         // ← 서비스에서 setCreatedAt 쓸 수 있게 추가
}
