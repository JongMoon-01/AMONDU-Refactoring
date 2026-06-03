package com.edtech.edtech_noticeboard.dto;

import org.springframework.web.multipart.MultipartFile;

public class NoticePostDto {
  @lombok.Data @lombok.NoArgsConstructor
  public static class Create {
    private String title;
    private String content;
    private MultipartFile file; // key: "file"
  }

  @lombok.Data @lombok.NoArgsConstructor
  public static class Update {
    private String title;
    private String content;
    private MultipartFile file; // 선택
  }
}