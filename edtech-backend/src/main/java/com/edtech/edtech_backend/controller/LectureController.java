package com.edtech.edtech_backend.controller;

import com.edtech.edtech_backend.dto.LectureResponseDto;
import com.edtech.edtech_backend.entity.Lecture;
import com.edtech.edtech_backend.repository.LectureRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
public class LectureController {

    private final LectureRepository lectureRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getLecture(@PathVariable Long id) {
        try {
            System.out.println("📌 [getLecture] 요청 들어옴, id = " + id);
            Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> {
                    System.out.println("❌ Lecture not found: id = " + id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found");
                });

            System.out.println("✅ Lecture found: " + lecture.getTitle());
            System.out.println(" - mpdPath: " + lecture.getMpdPath());
            System.out.println(" - vttPath: " + lecture.getVttPath());

            LectureResponseDto dto = new LectureResponseDto(lecture);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "서버 내부 오류 발생", "details", e.getMessage()));
        }
    }
    /* mpd 관련 프론트로 옮겨서 사용안함
    @GetMapping("/{id}/playback")
    public ResponseEntity<String> getModifiedMPD(@PathVariable Long id) throws IOException {
    System.out.println("📌 [getModifiedMPD] MPD 요청 수신 - lectureId: " + id);

    Lecture lecture = lectureRepository.findById(id)
        .orElseThrow(() -> {
            System.out.println("❌ Lecture not found");
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found");
        });

    String originalPath = "static" + lecture.getMpdPath();
    System.out.println("📂 원본 MPD 경로: " + originalPath);

    Resource resource = new ClassPathResource(originalPath);
    if (!resource.exists()) {
        System.out.println("❌ MPD 파일 없음: " + originalPath);
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "MPD 파일 없음");
    }

    String content = new String(resource.getInputStream().readAllBytes());

    String modified = content
        .replaceAll("media=\"(chunk_[^\"]+)\"", "media=\"/api/lectures/" + id + "/chunks/$1\"")
        .replaceAll("initialization=\"(init-stream[^\"]+)\"", "initialization=\"/api/lectures/" + id + "/chunks/$1\"");

    System.out.println("✅ 수정된 MPD 내용 일부 미리보기:\n" + modified.substring(0, Math.min(6000, modified.length())) + "...\n");

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(new MediaType("application", "dash+xml"));
    //headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=playback_lecture_" + id + ".mpd");

    return new ResponseEntity<>(modified, headers, HttpStatus.OK);
    }
     */
    @GetMapping("/{id}/subtitles") // VTT 경로 요청
    public ResponseEntity<Resource> getSubtitles(@PathVariable Long id) {
    System.out.println("📌 [getSubtitles] 요청: id = " + id);

    Lecture lecture = lectureRepository.findById(id)
        .orElseThrow(() -> {
            System.out.println("❌ Lecture not found");
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found");
        });

    String path = "static" + lecture.getVttPath();  // /vtt/h265_1920.vtt → static/vtt/h265_1920.vtt
    System.out.println("📁 Classpath VTT 경로: " + path);

    Resource resource = new ClassPathResource(path);
    if (!resource.exists()) {
        System.out.println("❌ 자막 파일 없음");
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "자막 파일 없음");
    }

    HttpHeaders headers = new HttpHeaders();
    headers.add(HttpHeaders.CONTENT_TYPE, "text/vtt");
    System.out.println("✅ 자막 응답 생성 완료");

    return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }
    /* mpd 관련 프론트로 옮겨서 사용안함
    @GetMapping("/{id}/chunks/{filename:.+}")
    public ResponseEntity<Resource> getChunk(@PathVariable Long id, @PathVariable String filename) throws IOException {
    System.out.println("📌 [getChunk] 청크 요청 수신");
    System.out.println(" - id: " + id);
    System.out.println(" - filename: " + filename);

    // 실제 경로 확인
    String path = "static/mpd/" + filename;
    Resource resource = new ClassPathResource(path);
    System.out.println("📁 [getChunk] 찾는 청크 경로 (Classpath 기준): " + path);

    // 존재 여부
    if (!resource.exists()) {
        System.out.println("❌ [getChunk] 파일이 존재하지 않음: " + path);
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "청크 파일 없음");
    }

    // 응답 전 확인
    System.out.println("✅ [getChunk] 파일 찾음: " + filename);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
    headers.setContentDisposition(ContentDisposition
        .inline()
        .filename(filename)
        .build());
    return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }
     */
}
