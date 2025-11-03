package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.DTO.BookDto;
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
public class FavoriteQueryController {
  private final FavoriteRepository favoriteRepo;

  // GET /likedBooks   (требует Authorization: Bearer <ACCESS>)
  @GetMapping("/likedBooks")
  public ResponseEntity<?> myFavorites(Authentication auth) {
    if (auth == null) return ResponseEntity.status(401).body(Map.of("error","UNAUTHORIZED"));

    UUID userId = UUID.fromString(auth.getName());
    var favs = favoriteRepo.findByUser_IdOrderByAddedAtDesc(userId); // один запрос, без N+1

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
