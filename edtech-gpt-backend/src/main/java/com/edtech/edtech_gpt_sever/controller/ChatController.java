// com.edtech.edtech_gpt_server.controller.ChatController.java
package com.edtech.edtech_gpt_sever.controller;


import com.edtech.edtech_gpt_sever.dto.ChatRequest;
import com.edtech.edtech_gpt_sever.dto.ChatResponse;
import com.edtech.edtech_gpt_sever.service.GptService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final GptService gptService;  // 이제 Spring이 주입해줌

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request) {
        System.out.println("📩 받은 메시지: " + request.getMessage());

        try {
            String gptReply = gptService.ask(request.getMessage());
            return new ChatResponse(gptReply);
        } catch (Exception e) {
            e.printStackTrace();
            return new ChatResponse("❌ GPT 처리 중 오류 발생: " + e.getMessage());
        }
    }
}

