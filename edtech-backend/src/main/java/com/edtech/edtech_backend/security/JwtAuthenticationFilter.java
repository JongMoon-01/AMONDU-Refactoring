package com.edtech.edtech_backend.security;

import com.edtech.edtech_backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;
    private final UserRepository userRepository;               // ✅ 필드 존재

    @Override
protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {

    System.out.println("🟡 [JwtFilter] 들어온 요청 URI: " + req.getRequestURI());
    System.out.println("🟡 [JwtFilter] Authorization 헤더: " + req.getHeader("Authorization"));

    String header = req.getHeader("Authorization");

    if (header != null && header.startsWith("Bearer ")) {
        String token = header.substring(7);
        try {
            Claims claims = jwt.parse(token).getBody();
            Long userId = Long.valueOf(claims.getSubject());
            String role = String.valueOf(claims.get("role"));

            System.out.println("✅ JWT userId: " + userId);
            System.out.println("✅ JWT role: " + role);

            userRepository.findById(userId).ifPresent(user -> {
                var authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());

                System.out.println("✅ Created authority: " + authority);

                var auth = new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(authority)
                );

                SecurityContextHolder.getContext().setAuthentication(auth);

                System.out.println("✅ Authentication set: " + auth.getName());
                System.out.println("✅ Authorities set: " + auth.getAuthorities());
            });
        } catch (Exception e) {
            System.out.println("❌ JWT parsing failed: " + e.getMessage());
        }
    } else {
        System.out.println("⚠️ Authorization 헤더가 없거나 Bearer 로 시작하지 않음");
    }

    chain.doFilter(req, res);
}

}
