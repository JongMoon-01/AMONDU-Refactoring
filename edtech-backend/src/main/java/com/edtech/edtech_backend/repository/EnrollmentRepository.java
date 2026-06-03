package com.edtech.edtech_backend.repository;

import com.edtech.edtech_backend.entity.Enrollment;
import com.edtech.edtech_backend.entity.User;
import com.edtech.edtech_backend.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.*;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
  Optional<Enrollment> findByUserAndClazz(User user, ClassEntity clazz);
  List<Enrollment> findByClazz_ClassIdAndStatus(Long classId, Enrollment.Status status);
  List<Enrollment> findByUser(User user);
  @Query("""
        select e from Enrollment e
        join fetch e.user u
        join e.clazz c
        where c.classId = :classId
    """)
    List<Enrollment> findWithUserByClassId(Long classId);
}
