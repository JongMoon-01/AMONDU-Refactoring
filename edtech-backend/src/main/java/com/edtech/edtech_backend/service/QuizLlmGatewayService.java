package com.edtech.edtech_backend.service;

import com.edtech.edtech_backend.dto.LlmQuizDto;
import com.edtech.edtech_backend.entity.Course;
import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import com.edtech.edtech_backend.entity.Lecture;
import com.edtech.edtech_backend.repository.CourseEngagementAnalyticsRepository;
import com.edtech.edtech_backend.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class QuizLlmGatewayService {

    private final CourseRepository courseRepo;
    private final CourseEngagementAnalyticsRepository ceaRepo;
    private final WebClient.Builder webClientBuilder;
    private final SubtitleService subtitleService;

    @Value("${llm.base-url:http://127.0.0.1:8082}")
    private String llmBaseUrl;

    private WebClient llmWebClient;

    @PostConstruct
    void initClient() {
        this.llmWebClient = webClientBuilder.baseUrl(llmBaseUrl).build();
    }

    // ③ attentionArr DB 조회 제거 — intervals를 호출자(Controller)로부터 직접 수신
    public List<LlmQuizDto.QuizItemDto> generateFromIntervals(
            Long classId, Long courseId, String userId,
            List<LlmQuizDto.IntervalDto> intervals
    ) {
        if (intervals == null || intervals.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "집중 안함 구간이 없습니다.");
        }

        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "코스를 찾을 수 없습니다."));
        Lecture lecture = course.getLecture();
        if (lecture == null) {
            throw new ResponseStatusException(BAD_REQUEST, "이 코스에 연결된 강의(lecture)가 없습니다.");
        }

        // analytics 레코드 존재 확인 (focusDropCount > 0 기준)
        CourseEngagementAnalytics cea = ceaRepo
                .findLatest(classId, courseId, userId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "집중도 분석 세션이 없습니다."));
        if (cea.getFocusDropCount() == null || cea.getFocusDropCount() == 0) {
            throw new ResponseStatusException(BAD_REQUEST, "집중 안함 구간이 없습니다.");
        }

        String vttText = subtitleService.loadVttTextByPath(lecture.getVttPath());
        if (vttText == null || vttText.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "VTT 자막 파일이 없습니다.");
        }

        LlmQuizDto.LlmQuizRequest req = new LlmQuizDto.LlmQuizRequest();
        req.setClassId(classId);
        req.setCourseId(courseId);
        req.setLectureId(lecture.getLectureId());
        req.setUserId(userId);
        req.setVttText(vttText);
        req.setIntervals(intervals);  // DB 조회 대신 전달받은 intervals 사용

        return llmWebClient.post()
                .uri("/llm/quiz-from-intervals")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<LlmQuizDto.QuizItemDto>>() {})
                .block();
    }
}
