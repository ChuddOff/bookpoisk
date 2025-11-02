package com.example.bookvopoisk.DTO;

import java.util.UUID;

public record ProfileDto(
  UUID id,            // локальный user id
  String username,    // Users.username
  String avatar,      // Users.avatarUrl
  String email,       // из AuthIdentity (google)
  Boolean emailVerified
) {}

