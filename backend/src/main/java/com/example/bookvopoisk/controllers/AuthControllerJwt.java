package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.models.Users;
import com.example.bookvopoisk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthControllerJwt {
  private final UserRepository usersRepo;
  @GetMapping("/info")
  public Map<String, Object> me(Authentication auth) {
    // токена не было или он невалидный → сразу говорим, что пользователь не аутентифицирован.
    if (auth == null) return Map.of("authenticated", false); //
    // getName() тут = твой UUID (так настроено фильтром/логином).
    UUID userId = UUID.fromString(auth.getName());
    // Ищем пользователя в БД.
    Users u = usersRepo.findById(userId).orElse(null);
    if (u == null) return Map.of("authenticated", false);
    // возвращаем базовую инфу, если всё ок.
    return Map.of(
      "authenticated", true,
      "userId", u.getId(),
      "username", u.getUsername(),
      "active", u.isActive()
    );
  }
}
// это простой путь после логина, чтобы фронт по присланному Bearer JWT:
// проверить, валиден ли токен (на бэке),
// узнать базовые данные из твоей БД: userId, username, active
