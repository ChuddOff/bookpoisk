package com.example.bookvopoisk.googleRegistration;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;


@Component
public class JwtUtil {

  private final SecretKey key;
  private final long ttlSeconds;

  public JwtUtil(
    // Секрет и TTL берутся из application.yml: app.auth.jwt.secret / access-ttl-seconds.
    @Value("${app.auth.jwt.secret}") String secret,
    @Value("${app.auth.jwt.access-ttl-seconds}") long ttlSeconds
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.ttlSeconds = ttlSeconds;
  }

  public String generateAccess(UUID userId, String username) {
    Instant now = Instant.now();
    return Jwts.builder()
      .subject(userId.toString()) // мой локальный UUID.
      .claim("username", username) // кастомный клейм "username" = значение username
      .issuedAt(Date.from(now)) // iat (issued at) = now
      .expiration(Date.from(now.plusSeconds(ttlSeconds))) // xp (expiration) = now + ttlSeconds (из application.yml)
      .signWith(key) // key = Keys.hmacShaKeyFor(secret.getBytes(UTF_8)), key — симметричный ключ, полученный из app.auth.jwt.secret.
      .compact();
      // Результат — строка вида header.payload.signature в Base64url
  }

  public Jws<Claims> parse(String token) {
    return Jwts.parser()
      .verifyWith(key) // сообщает парсеру, каким ключом проверки пользоваться
      .build() // строит финальный объект парсера (immutable) с учётом всех настроек (в том числе ключа из verifyWith
      .parseSignedClaims(token); // парсит подписанный JWT (JWS) с payload-типа Claims и проверяет подпись
  }
}
