package com.edtech.edtech_noticeboard.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String save(MultipartFile file);
    default String publicUrl(String fileName) { return "/files/" + fileName; } // 필요시 사용
}
