package com.edtech.edtech_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter 
@Setter
@Entity
@Table(name="user", uniqueConstraints=@UniqueConstraint(columnNames="email"))
public class User {
  @Id 
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "user_id") 
  private Long userId;

  @Column(nullable=false) 
  private String email;

  private String name;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(length = 20)
  private String phone;

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private java.util.Set<Enrollment> enrollments = new java.util.HashSet<>();

  @Enumerated(EnumType.STRING)
  private Role role = Role.STUDENT;           // 기본값 대문자

  public enum Role { ADMIN, STUDENT }         // 대문자
}

