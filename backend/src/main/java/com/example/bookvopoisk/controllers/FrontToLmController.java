package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.DTO.FavouriteBookDto;
import com.example.bookvopoisk.DTO.LmCallbackPayload;
import com.example.bookvopoisk.Service.FavoriteService;
import com.example.bookvopoisk.Service.LmPushService;
import com.example.bookvopoisk.models.RecommendationStore;
import com.example.bookvopoisk.googleRegistration.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.*;

@RestController
@RequiredArgsConstructor
public class FrontToLmController {

  private final FavoriteService favoriteService;
  private final LmPushService lmPushService;
  private final RecommendationStore store;
  private final JwtUtil jwtUtil;

  @Value("${lm.webhook-secret:}")
  private String webhookSecret;

  /** Шаг 1: фронт вызывает — мы запускаем генерацию у LM и возвращаем requestId */
  @PostMapping("/bookForMe")
  public ResponseEntity<Map<String, Object>> startBooksForMe(
    @RequestHeader(name = "Authorization", required = false) String authHdr,
    Authentication auth
  ) {
    UUID userId = extractUserId(auth, authHdr);
    if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

    List<FavouriteBookDto> favorites = favoriteService.listFavouriteBooks(userId);

    UUID requestId = UUID.randomUUID();
    String callbackUrl = ServletUriComponentsBuilder
      .fromCurrentContextPath()
      .path("/lm/callback/{requestId}")
      .buildAndExpand(requestId)
      .toUriString();

    lmPushService.requestAsync(userId, favorites, callbackUrl, requestId);

    Map<String, Object> body = Map.of(
      "requestId", requestId,
      "poll", ServletUriComponentsBuilder.fromCurrentContextPath()
        .path("/booksForMe/result/{requestId}")
        .buildAndExpand(requestId).toUriString()
    );
    return ResponseEntity.accepted().body(body);
  }


  /** Шаг 2: фронт опрашивает результат по requestId */
  @PostMapping("/booksForMe/result/{requestId}")
  public ResponseEntity<?> pollBooksForMe(@PathVariable UUID requestId) {
    return store.load(requestId)
      .<ResponseEntity<?>>map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.ACCEPTED)
        .body(Map.of("status", "PENDING", "requestId", requestId)));
  }


  /** Шаг 3: коллбэк от LM с готовыми рекомендованными книгами */
  @PostMapping("/lm/callback/{requestId}")
  public ResponseEntity<Void> lmCallback(
    @PathVariable UUID requestId,
    @RequestHeader(name = "X-LM-Secret", required = false) String secret,
    @RequestBody LmCallbackPayload payload
  ) {
    System.out.println("### lmCallback hit for requestId=" + requestId);
    if (webhookSecret != null && !webhookSecret.isBlank()) {
      if (secret == null || !webhookSecret.equals(secret)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
    }

    UUID userId = payload.userId();
    List<FavouriteBookDto> recommended = payload.recommendations();

    store.save(requestId, userId, recommended);
    return ResponseEntity.noContent().build();
  }


  private UUID extractUserId(Authentication auth, String authHdr) {
    if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
      try { return UUID.fromString(auth.getName()); } catch (IllegalArgumentException ignored) {}
    }
    if (authHdr != null && authHdr.startsWith("Bearer ")) {
      String token = authHdr.substring("Bearer ".length()).trim();
      String sub = jwtUtil.subject(token);
      try { return UUID.fromString(sub); } catch (IllegalArgumentException ignored) {}
    }
    return null;
  }
}
