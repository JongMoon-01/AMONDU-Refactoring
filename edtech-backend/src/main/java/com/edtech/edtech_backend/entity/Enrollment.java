package com.edtech.edtech_backend.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@Table(name = "enrollment",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","class_id"}))
public class Enrollment {

  public enum Status { APPROVED, PENDING, REJECTED }

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false) @JoinColumn(name = "user_id")
  private User user;

  @ManyToOne(optional = false) @JoinColumn(name = "class_id")
  private ClassEntity clazz; // Class는 예약어라 피함

  @Enumerated(EnumType.STRING)
  private Status status = Status.APPROVED; // 지금은 자동 승인

  private LocalDateTime createdAt;

  @PrePersist void prePersist() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
