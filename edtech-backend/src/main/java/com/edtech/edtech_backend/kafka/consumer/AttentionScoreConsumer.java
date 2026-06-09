package com.edtech.edtech_backend.kafka.consumer;

import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import com.edtech.edtech_backend.kafka.event.AttentionScoreMeasuredEvent;
import com.edtech.edtech_backend.repository.CourseEngagementAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class AttentionScoreConsumer {

    private final CourseEngagementAnalyticsRepository ceaRepo;

    @KafkaListener(
        topics = "attention.score.measured",
        groupId = "edtech-analytics-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(AttentionScoreMeasuredEvent event) {
        log.info("[Kafka] attention.score.measured received: userId={}, classId={}",
                event.userId(), event.classId());

        // 최신 analytics 레코드 업데이트 (없으면 신규 생성)
        ceaRepo.findLatest(event.classId(), event.courseId(), event.userId())
                .ifPresentOrElse(
                    cea -> {
                        cea.setAvgFocusScore(event.avgFocusScore());
                        cea.setFocusDropCount(event.focusDropCount());
                        ceaRepo.save(cea);
                        log.info("[Kafka] CEA updated: id={}", cea.getCourseAnalyticsId());
                    },
                    () -> {
                        // REST /api/focus/intervals 호출 전 이벤트가 먼저 도착한 경우 생성
                        CourseEngagementAnalytics cea = new CourseEngagementAnalytics();
                        cea.setUserId(event.userId());
                        cea.setCourseId(event.courseId());
                        cea.setAvgFocusScore(event.avgFocusScore());
                        cea.setFocusDropCount(event.focusDropCount());
                        cea.setStartedAt(Instant.ofEpochMilli(event.measuredAt()));
                        ceaRepo.save(cea);
                        log.info("[Kafka] CEA created from event");
                    }
                );
    }
}
