package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.DTO.FavouriteBookDto;
import com.example.bookvopoisk.Service.FavoriteService;
import com.example.bookvopoisk.Service.LmPushService;
import com.example.bookvopoisk.googleRegistration.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;   // ВАЖНО: правильный импорт
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class FrontToLmController {

  private final FavoriteService favoriteService;
  private final LmPushService lmPushService;
  private final JwtUtil jwtUtil;

  @PostMapping("/booksForMe")
  public ResponseEntity<List<FavouriteBookDto>> frontToLmController(
    @RequestHeader(name = "Authorization", required = false) String authHdr,
    Authentication auth
  ) {
    UUID userId = extractUserId(auth, authHdr);
    if (userId == null) {
      return ResponseEntity.status(401).build();
    }

    List<FavouriteBookDto> books = favoriteService.listFavouriteBooks(userId);

    List<FavouriteBookDto> recommended = lmPushService.callFavoritesAsDtos(userId, books);
    return ResponseEntity.ok(recommended);
  }

  private UUID extractUserId(Authentication auth, String authHdr) {
    // пробуем взять из SecurityContext
    if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
      try { return UUID.fromString(auth.getName()); } catch (IllegalArgumentException ignored) {}
    }
    // fallback: из Bearer-заголовка
    if (authHdr != null && authHdr.startsWith("Bearer ")) {
      String token = authHdr.substring("Bearer ".length()).trim();
      String sub = jwtUtil.subject(token);   // ДОЛЖЕН вернуть строковый subject
      try { return UUID.fromString(sub); } catch (IllegalArgumentException ignored) {}
    }
    return null;
  }
}
