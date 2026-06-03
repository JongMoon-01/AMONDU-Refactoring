package com.edtech.edtech_backend.service;

import com.edtech.edtech_backend.dto.LlmQuizDto;
import com.edtech.edtech_backend.entity.Course;
import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import com.edtech.edtech_backend.entity.FocusInterval;
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

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class QuizLlmGatewayService {

    private final CourseRepository courseRepo;
    private final CourseEngagementAnalyticsRepository ceaRepo;
    private final WebClient.Builder webClientBuilder;   // ✅ Builder 주입
    private final SubtitleService subtitleService;

    @Value("${llm.base-url:http://127.0.0.1:8082}")
    private String llmBaseUrl;

    private WebClient llmWebClient;                     // ✅ 실제 사용 클라이언트

    @PostConstruct
    void initClient() {
        this.llmWebClient = webClientBuilder.baseUrl(llmBaseUrl).build();
    }

    public List<LlmQuizDto.QuizItemDto> generateFromIntervals(Long classId, Long courseId, String userId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "코스를 찾을 수 없습니다."));
        Lecture lecture = course.getLecture();
        if (lecture == null) throw new ResponseStatusException(BAD_REQUEST, "이 코스에 연결된 강의(lecture)가 없습니다.");

        CourseEngagementAnalytics cea = ceaRepo
                .findLatest(classId, courseId, userId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "집중 안함 구간 세션이 없습니다."));
        if (cea.getAttentionArr() == null || cea.getAttentionArr().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "집중 안함 구간이 없습니다.");
        }

        String vttPath = lecture.getVttPath();
        String vttText = subtitleService.loadVttTextByPath(vttPath);
        if (vttText == null || vttText.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "VTT 자막 파일이 없습니다.");
        }

        LlmQuizDto.LlmQuizRequest req = new LlmQuizDto.LlmQuizRequest();
        req.setClassId(classId);
        req.setCourseId(courseId);
        req.setLectureId(lecture.getLectureId());
        req.setUserId(userId);
        req.setVttText(vttText);
        req.setIntervals(toIntervalDtos(cea));

        return llmWebClient.post()
                .uri("/llm/quiz-from-intervals")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<LlmQuizDto.QuizItemDto>>() {})
                .block();
    }

   private List<LlmQuizDto.IntervalDto> toIntervalDtos(CourseEngagementAnalytics cea) {
    long base = 0L;
    if (cea.getStartedAt() != null) {
        base = cea.getStartedAt().toEpochMilli();
    }
    final long baseMs = base;

    return cea.getAttentionArr().stream()
        .sorted(Comparator.comparing(FocusInterval::getStartAt, Comparator.nullsLast(Comparator.naturalOrder())))
        .map(fi -> {
            long sAbs = fi.getStartAt() != null ? fi.getStartAt().toEpochMilli() : baseMs;
            long eAbs = fi.getEndAt()   != null ? fi.getEndAt().toEpochMilli()   : (sAbs + Math.max(1000L, fi.getDurationSec() * 1000L));

            long s = Math.max(0L, sAbs - baseMs);              // ▶ 세션 시작 기준 상대 ms
            long e = Math.max(s + 1000L, eAbs - baseMs);

            LlmQuizDto.IntervalDto d = new LlmQuizDto.IntervalDto();
            d.setStart(s);
            d.setEnd(e);
            d.setDurationSec((int)Math.max(1, (e - s) / 1000));
            d.setAvgScore(fi.getAvgScore());
            return d;
        })
        .collect(Collectors.toList());
    }

}
