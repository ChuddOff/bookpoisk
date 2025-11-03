package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.DTO.LikeRequest;
import com.example.bookvopoisk.models.Favorites;
import com.example.bookvopoisk.repository.BookRepository;
import com.example.bookvopoisk.repository.FavoriteRepository;
import com.example.bookvopoisk.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class FavoriteController {
  private final FavoriteRepository favoriteRepo;
  private final UserRepository usersRepo;
  private final BookRepository bookRepo;

  @PostMapping(value = "/likeBook", consumes = "application/json")
  @Transactional
  public ResponseEntity<?> likeBook(@RequestBody LikeRequest req, Authentication auth) {
    if (req == null || req.id() == null) {
      return ResponseEntity.badRequest().body(Map.of("error","BOOK_ID_REQUIRED"));
    }
    UUID userId = UUID.fromString(auth.getName());
    UUID bookId = req.id();

    if (favoriteRepo.existsByUser_IdAndBook_Id(userId, bookId)) {
      return ResponseEntity.ok(Map.of("liked", true));
    }
    var fav = new Favorites();
    fav.setUser(usersRepo.getReferenceById(userId));
    fav.setBook(bookRepo.getReferenceById(bookId));
    favoriteRepo.save(fav);
    return ResponseEntity.status(201).body(Map.of("liked", true));
  }

  @PostMapping(value="/unlikeBook", consumes="application/json")
  @Transactional
  public ResponseEntity<?> unlikeBook(@RequestBody LikeRequest req, Authentication auth) {
    UUID bookId = (req != null ? req.effectiveId() : null);
    if (bookId == null) {
      return ResponseEntity.badRequest().body(Map.of(
        "error","BOOK_ID_REQUIRED",
        "hint","send {\"id\":\"<uuid>\"} or {\"data\":{\"id\":\"<uuid>\"}}"
      ));
    }
    UUID userId = UUID.fromString(auth.getName());
    favoriteRepo.deleteByUser_IdAndBook_Id(userId, bookId);
    return ResponseEntity.ok(Map.of("liked", false));
  }
}
