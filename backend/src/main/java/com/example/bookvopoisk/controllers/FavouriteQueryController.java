package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class FavouriteQueryController {
  private final FavoriteRepository favoriteRepo;

  // GET /likedBooks   (требует Authorization: Bearer <ACCESS>)
  @GetMapping("/likedBooks")
  public ResponseEntity<?> myFavorites(Authentication auth) {
    if (auth == null) return ResponseEntity.status(401).body(Map.of("error","UNAUTHORIZED"));

    UUID userId = UUID.fromString(auth.getName()); // userId из access-токена
    var items = favoriteRepo.findFavoriteBooksByUserId(userId);

    return ResponseEntity.ok(Map.of(
      "data", items,
      "items", items.size()
    ));
  }
}
