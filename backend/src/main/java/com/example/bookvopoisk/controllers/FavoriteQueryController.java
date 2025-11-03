package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.DTO.BookDto;
import com.example.bookvopoisk.googleRegistration.JwtUtil;
import com.example.bookvopoisk.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class FavoriteQueryController {
  private final FavoriteRepository favoriteRepo;
  private final JwtUtil jwt; // добавь в конструктор

  @GetMapping("/likedBooks")
  public ResponseEntity<?> myFavorites(
    @RequestHeader(name="Authorization", required=false) String authHdr,
    Authentication auth
  ) {
    UUID userId = null;

    if (auth != null) {
      userId = UUID.fromString(auth.getName());
    } else if (authHdr != null && authHdr.startsWith("Bearer ")) {
      try {
        userId = UUID.fromString(jwt.subject(authHdr.substring(7).trim()));
      } catch (Exception ignored) {}
    }

    if (userId == null) {
      return ResponseEntity.status(401).body(Map.of("error","UNAUTHORIZED"));
    }

    var favs = favoriteRepo.findByUser_IdOrderByAddedAtDesc(userId);
    var items = favs.stream().map(f -> {
      var b = f.getBook();
      return new BookDto(
        b.getId(), b.getTitle(), b.getAuthor(), b.getYear(),
        b.getGenres(), b.getPages(), b.getDescription(), b.getCover()
      );
    }).toList();

    return ResponseEntity.ok(Map.of("data", items, "items", items.size()));
  }
}

