package com.example.bookvopoisk.RefreshToken;

import com.example.bookvopoisk.models.RefreshToken;
import com.example.bookvopoisk.models.Users;
import com.example.bookvopoisk.repository.RefreshTokenRepository;
import com.example.bookvopoisk.repository.UserRepository;
import com.example.bookvopoisk.hash.TokenHashes;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshServiceImpl implements RefreshService { // атомарный (транзакционный) сервис управления refresh-токенами:

  private final RefreshTokenRepository refreshTokenRepository;
  private final UserRepository userRepository;

  private static final Duration RT_TTL = Duration.ofDays(30); // срок жизни refresh.
  private static final SecureRandom RNG = new SecureRandom();

  private static String randomToken() {
    byte[] b = new byte[32]; // 256-bit
    RNG.nextBytes(b);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
  }

  @Override
  @Transactional
  public String issue(UUID userId) { // выдать новый refresh пользователю.
    Users user = userRepository.findById(userId).orElseThrow(); // нашли пользователя

    String raw = randomToken(); // генерируем секрет (raw)
    String hash = TokenHashes.sha256Base64Url(raw); // считаем хэш, который и кладём в БД

    RefreshToken rt = new RefreshToken();
    // id не трогаем — у тебя @GeneratedValue
    rt.setUser(user);
    rt.setIssuedAt(Instant.now());
    rt.setExpiresAt(Instant.now().plus(RT_TTL));
    rt.setRefreshTokenHash(hash);
    rt.setRevoked(false);

    refreshTokenRepository.save(rt);
    return raw;
  }

  @Override
  @Transactional
  public RotationResult consumeAndRotate(String raw) { // проверить присланный raw-refresh и ротировать (старый → revoked, создать новый).
    String hash = TokenHashes.sha256Base64Url(raw);
    RefreshToken current = refreshTokenRepository
      .findByRefreshTokenHash(hash)            // Находим пользователя
      .orElseThrow(() -> new IllegalArgumentException("invalid refresh"));

    Instant now = Instant.now();
    if (current.isRevoked() || current.getExpiresAt().isBefore(now)) {
      throw new IllegalArgumentException("expired or revoked");
    }

    // revoke старый
    current.setRevoked(true);

    // создать новый
    String newRaw = randomToken();
    String newHash = TokenHashes.sha256Base64Url(newRaw);

    RefreshToken next = new RefreshToken();
    next.setUser(current.getUser());
    next.setIssuedAt(now);
    next.setExpiresAt(now.plus(RT_TTL));
    next.setRefreshTokenHash(newHash);
    next.setRevoked(false);

    refreshTokenRepository.save(next);

    return new RotationResult(current.getUser().getId(), newRaw, next.getExpiresAt());
  }
}
