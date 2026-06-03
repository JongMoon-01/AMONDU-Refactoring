// com.edtech.edtech_gpt_server.service.GptService.java
package com.edtech.edtech_gpt_sever.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GptService {

    @Value("${gpt.api-key}")
    private String apiKey;

    @Value("${gpt.model}")
    private String model;

    private WebClient webClient;

    @PostConstruct
    public void initWebClient() {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1/chat/completions")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    public String ask(String message) {
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", new Object[] {
                        Map.of("role", "user", "content", message)
                },
                "temperature", 0.7,
                "max_tokens", 1024
        );

        Map<?, ?> response = webClient.post()
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null) return "응답 없음";

        try {
            return ((Map<?, ?>) ((java.util.List<?>) response.get("choices")).get(0))
                    .get("message").toString();
        } catch (Exception e) {
            return "GPT 응답 처리 실패: " + e.getMessage();
        }
    }
}
