package com.example.bookvopoisk.dto;

public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        String role
) {
}
