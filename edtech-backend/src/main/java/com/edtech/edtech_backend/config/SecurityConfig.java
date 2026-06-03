// SecurityConfig.java
package com.edtech.edtech_backend.config;

import com.edtech.edtech_backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**", "/error").permitAll()
                // ⬇️ 먼저 특정(me) 엔드포인트를 인증 요구로
                .requestMatchers(HttpMethod.GET, "/api/classes/me/**").authenticated()
                // ⬇️ 그 다음 일반 목록은 공개
                .requestMatchers(HttpMethod.GET, "/api/classes/**").permitAll()
                // 스트리밍 파일
                .requestMatchers(HttpMethod.GET, "/api/lectures/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/mpd/**", "/vtt/**").permitAll()
                .requestMatchers(HttpMethod.POST,   "/api/classes/*/enroll").hasAnyRole("STUDENT","ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/classes/*/enroll").hasAnyRole("STUDENT","ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/classes").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/quizzes/**").hasAnyRole("STUDENT","ADMIN")
                .requestMatchers(HttpMethod.GET,  "/api/quizzes/**").hasAnyRole("STUDENT","ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/classes/*/courses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,  "/api/classes/*/courses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE,"/api/classes/*/courses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/classes/*/students").hasRole("ADMIN")
                .anyRequest().authenticated()
            )   
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration conf = new CorsConfiguration();
        conf.setAllowedOrigins(List.of("http://localhost:3000"));
        conf.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        conf.setAllowedHeaders(List.of("*"));
        conf.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", conf);
        return source;
    }
}