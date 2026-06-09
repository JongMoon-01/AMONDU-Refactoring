package com.edtech.edtech_backend.kafka.producer;

import com.edtech.edtech_backend.kafka.event.EnrollmentCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EnrollmentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishEnrollmentCreated(EnrollmentCreatedEvent event) {
        kafkaTemplate.send("enrollment.created",
                String.valueOf(event.userId()), event);
        log.info("[Kafka] enrollment.created published: userId={}, classId={}",
                event.userId(), event.classId());
    }
}
