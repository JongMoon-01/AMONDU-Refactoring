// src/main/java/com/edtech/edtech_backend/service/SubtitleService.java
package com.edtech.edtech_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@RequiredArgsConstructor
public class SubtitleService {

    private final ResourceLoader resourceLoader;

    public String loadVttTextByPath(String path) {
        if (path == null || path.isBlank()) return null;

        // 1) 절대 파일 경로면 파일로 시도 (C:\..., /var/..., 등)
        try {
            Path p = Path.of(path);
            if (p.isAbsolute() && Files.exists(p)) {
                return Files.readString(p, StandardCharsets.UTF_8);
            }
        } catch (Exception ignore) {}

        // 2) 리소스 로더로 시도
        // - DB에 'classpath:static/vtt/h265_1920.vtt' 저장해도 됨
        // - '/vtt/h265_1920.vtt' 또는 'vtt/h265_1920.vtt'도 지원
        String cp = toClasspath(path);
        try {
            Resource r = resourceLoader.getResource(cp);
            if (r.exists()) {
                try (var in = r.getInputStream()) {
                    return new String(in.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            // 아래 throw로 이어짐
        }

        throw new RuntimeException("Failed to load VTT: " + path);
    }

    public boolean exists(String path) {
        if (path == null || path.isBlank()) return false;
        try {
            Path p = Path.of(path);
            if (p.isAbsolute() && Files.exists(p)) return true;
        } catch (Exception ignore) {}
        return resourceLoader.getResource(toClasspath(path)).exists();
    }

    private String toClasspath(String path) {
        // 이미 스킴을 붙여 저장했으면 그대로 사용
        if (path.startsWith("classpath:") || path.startsWith("file:")) return path;

        // '/vtt/...' 또는 'vtt/...' → classpath:static/vtt/...
        String p = path.startsWith("/") ? path.substring(1) : path;
        if (!p.startsWith("static/")) p = "static/" + p;
        return "classpath:" + p;
    }
}
