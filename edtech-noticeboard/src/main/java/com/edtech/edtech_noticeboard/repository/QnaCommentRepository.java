package com.edtech.edtech_noticeboard.repository;

import com.edtech.edtech_noticeboard.entity.QnaComment;
import com.edtech.edtech_noticeboard.entity.QnaPost;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QnaCommentRepository extends JpaRepository<QnaComment, Long> {
    List<QnaComment> findByQnaPost(QnaPost post);
    List<QnaComment> findByQnaPostId(Long postId); // 서비스에서 쓰기 쉬움
}
