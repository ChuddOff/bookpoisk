package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.RefreshToken.RefreshService;
import com.example.bookvopoisk.googleRegistration.JwtUtil;
import com.example.bookvopoisk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class RefreshController {

  private final RefreshService refreshService;
  private final JwtUtil jwt;              // твой JwtUtil (generateAccess/parse)
  private final UserRepository usersRepo;

  @PostMapping("/refresh")
  public ResponseEntity<?> refresh(@RequestHeader(name="Authorization", required=false) String auth) {
    if (auth == null || !auth.startsWith("Bearer ")) {
      return ResponseEntity.status(401).body(Map.of("error","NO_REFRESH"));
    }
    String rawRefresh = auth.substring("Bearer ".length()).trim();

    RefreshService.RotationResult rr;
    try {
      rr = refreshService.consumeAndRotate(rawRefresh);
    } catch (Exception e) {
      return ResponseEntity.status(401).body(Map.of("error","REFRESH_INVALID"));
    }

    var user = usersRepo.findById(rr.userId()).orElse(null);
    if (user == null || !user.isActive()) {
      return ResponseEntity.status(401).body(Map.of("error","USER_NOT_FOUND"));
    }

    String access = jwt.generateAccess(user.getId(), user.getUsername());
    return ResponseEntity.ok(Map.of(
      "access", access,
      "refresh", rr.newRawRefresh()
    ));
  }
}
// это простой путь после логина, чтобы фронт по присланному Bearer JWT:
// проверить, валиден ли токен (на бэке),
// узнать базовые данные из твоей БД: userId, username, active
