package com.edtech.edtech_backend.controller.auth;

import com.edtech.edtech_backend.dto.auth.AuthResponseDto;
import com.edtech.edtech_backend.dto.auth.LoginRequestDto;        
import com.edtech.edtech_backend.dto.auth.RegisterRequestDto;     
import com.edtech.edtech_backend.entity.User;
import com.edtech.edtech_backend.repository.UserRepository;
import com.edtech.edtech_backend.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwt;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto req) { // ✅ 타입 변경
        userRepository.findByEmail(req.getEmail())
                .ifPresent(u -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "email exists"); });

        User u = new User();
        u.setName(req.getName());
        u.setEmail(req.getEmail());
        u.setPhone(req.getPhone());  // ✅ 연락처 저장
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));

        // ✅ 역할 매핑 (대소문자 허용)
        try {
                u.setRole(User.Role.valueOf(req.getRole().toUpperCase()));
        } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role must be STUDENT or ADMIN");
        }

        User saved = userRepository.save(u);
        String token = jwt.createToken(saved.getUserId(), saved.getRole().name(), saved.getEmail());

        return ResponseEntity.ok(new AuthResponseDto(
            token, saved.getUserId(), saved.getName(), saved.getEmail(), saved.getRole().name()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto req) {
        User u = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), u.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }

        String token = jwt.createToken(u.getUserId(), u.getRole().name(), u.getEmail());

        return ResponseEntity.ok(new AuthResponseDto(
                token, u.getUserId(), u.getName(), u.getEmail(), u.getRole().name()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponseDto> me(Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        String email = (String) auth.getPrincipal();
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        String token = jwt.createToken(u.getUserId(), u.getRole().name(), u.getEmail());

        return ResponseEntity.ok(new AuthResponseDto(
                token, u.getUserId(), u.getName(), u.getEmail(), u.getRole().name()
        ));
    }
}
