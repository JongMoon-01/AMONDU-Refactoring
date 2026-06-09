package com.edtech.edtech_backend.kafka.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic enrollmentCreatedTopic() {
        return TopicBuilder.name("enrollment.created")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic attentionScoreMeasuredTopic() {
        return TopicBuilder.name("attention.score.measured")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic quizGeneratedTopic() {
        return TopicBuilder.name("quiz.generated")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
