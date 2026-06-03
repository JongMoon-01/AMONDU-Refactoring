// src/main/java/.../config/JwtDecoderConfig.java
package com.edtech.edtech_noticeboard.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtDecoderConfig {

    @Value("${jwt.secret}")
    private String secretPlain;  // 8080과 동일한 값

    private SecretKey secretKey;

    @PostConstruct
    void initKey() {
        // ✅ 8080과 동일하게 "평문 UTF-8 바이트"로 키 생성
        byte[] keyBytes = secretPlain.getBytes(StandardCharsets.UTF_8);
        this.secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withSecretKey(secretKey)
            .macAlgorithm(MacAlgorithm.HS256)  // ✅ 토큰 header alg와 일치
            .build();

        decoder.setJwtValidator(JwtValidators.createDefault());
        return decoder;
    }
}