package com.example.bookvopoisk.RefreshToken;

import java.util.UUID;

public record JwtUserPrincipal(UUID userId, String username) {}
