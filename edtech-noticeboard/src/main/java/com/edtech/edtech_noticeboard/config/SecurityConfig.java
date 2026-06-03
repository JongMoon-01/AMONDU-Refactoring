// com.edtech.edtech_noticeboard.config.SecurityConfig
package com.edtech.edtech_noticeboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())      // ← WebConfig의 CORS Bean 사용
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // 1) 프리플라이트 무조건 통과
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // 2) 공개 엔드포인트 있으면 여기에 permitAll 추가
                // .requestMatchers("/ping").permitAll()
                .requestMatchers(HttpMethod.GET, "/files/**").permitAll()
                // 3) 나머지는 인증
                .anyRequest().authenticated()
            )
            // 리소스 서버(JWT) 쓰면 유지
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));

        return http.build();
    }
}
