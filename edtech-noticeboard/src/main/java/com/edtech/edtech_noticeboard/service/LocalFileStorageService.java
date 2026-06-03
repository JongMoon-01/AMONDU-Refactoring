package com.edtech.edtech_noticeboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public String save(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);

            String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
            String ext = original.lastIndexOf('.') >= 0 ? original.substring(original.lastIndexOf('.')) : "";
            String unique = UUID.randomUUID() + ext;

            Path dest = dir.resolve(unique);
            file.transferTo(dest.toFile());
            return unique;
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 실패", e);
        }
    }
}
