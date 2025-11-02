package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.DTO.ProfileDto;
import com.example.bookvopoisk.googleRegistration.JwtUtil;
import com.example.bookvopoisk.models.AuthIdentity;
import com.example.bookvopoisk.models.Users;
import com.example.bookvopoisk.repository.AuthIdentityRepository;
import com.example.bookvopoisk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class ProfileController {

  private final JwtUtil jwt;
  private final UserRepository usersRepo;
  private final AuthIdentityRepository authRepo;

  @GetMapping("/me")
  public ResponseEntity<?> me(@RequestHeader(name="Authorization", required=false) String authHdr) {
    if (authHdr == null || !authHdr.startsWith("Bearer ")) {
      return ResponseEntity.status(401).body(Map.of("error","NO_TOKEN"));
    }

    final UUID userId;
    try {
      userId = UUID.fromString(jwt.subject(authHdr.substring("Bearer ".length()).trim()));
    } catch (Exception e) {
      return ResponseEntity.status(401).body(Map.of("error","INVALID_TOKEN"));
    }

    Users u = usersRepo.findById(userId).orElse(null);
    if (u == null) {
      return ResponseEntity.status(404).body(Map.of("error","USER_NOT_FOUND"));
    }

    // Достаём email и emailVerified из связываний (обычно "google")
    List<AuthIdentity> links = authRepo.findAllByUserId(userId);
    String email = links.stream().map(AuthIdentity::getEmail).filter(Objects::nonNull).findFirst().orElse(null);
    Boolean emailVerified = links.stream().map(AuthIdentity::getEmailVerified).filter(Objects::nonNull).findFirst().orElse(null);

    ProfileDto dto = new ProfileDto(
      u.getId(),
      u.getUsername(),
      u.getAvatarUrl(),
      email,
      emailVerified
    );
    return ResponseEntity.ok(dto);
  }
}
