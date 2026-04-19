package com.example.bookvopoisk.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserProfileResponse profile
) {
}
