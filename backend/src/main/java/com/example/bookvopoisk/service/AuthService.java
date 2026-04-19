package com.example.bookvopoisk.service;

import com.example.bookvopoisk.dto.*;
import com.example.bookvopoisk.entity.BankUser;
import com.example.bookvopoisk.enums.Role;
import com.example.bookvopoisk.exception.ApiException;
import com.example.bookvopoisk.repository.BankUserRepository;
import com.example.bookvopoisk.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final BankUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException("Email already registered");
        }

        BankUser user = BankUser.builder()
                .email(request.email().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .role(Role.USER)
                .enabled(true)
                .createdAt(OffsetDateTime.now())
                .build();

        BankUser saved = userRepository.save(user);
        return toProfile(saved);
    }

    public AuthResponse login(LoginRequest request) {
        BankUser user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException("User not found"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException("Invalid credentials");
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                Map.of("role", user.getRole().name(), "uid", user.getId())
        );

        return new AuthResponse(token, "Bearer", jwtService.getAccessTtlSeconds(), toProfile(user));
    }

    public BankUser getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("Authenticated user not found"));
    }

    public UserProfileResponse toProfile(BankUser user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole().name());
    }
}
