package com.edtech.edtech_backend.kafka.consumer;

import com.edtech.edtech_backend.kafka.event.QuizGeneratedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class QuizGeneratedConsumer {

    @KafkaListener(
        topics = "quiz.generated",
        groupId = "edtech-quiz-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(QuizGeneratedEvent event) {
        // 현재: 로그만 기록 (⑥ 모니터링 연동 시 메트릭 카운터 추가 예정)
        log.info("[Kafka] quiz.generated: userId={}, courseId={}, count={}",
                event.userId(), event.courseId(), event.quizCount());
    }
}
