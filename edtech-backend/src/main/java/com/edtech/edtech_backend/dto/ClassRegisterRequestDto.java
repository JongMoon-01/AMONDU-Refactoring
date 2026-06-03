package com.edtech.edtech_backend.dto;

import lombok.Getter;

@Getter
public class ClassRegisterRequestDto {
    private String title;
    private String tag; // 태그는 프론트에서 join된 문자열로 보낸다고 가정 (예: "#태그1,#태그2")
    private int headcount;
}
