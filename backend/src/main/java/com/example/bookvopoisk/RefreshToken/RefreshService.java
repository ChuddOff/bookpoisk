package com.example.bookvopoisk.RefreshToken;

import java.time.Instant;
import java.util.UUID;

public interface RefreshService {
  /** Создать новый refresh и вернуть RAW (который клиент сохранит). */
  String issue(UUID userId);

  /** Проверить RAW-refresh, отозвать его и выдать новый. */
  RotationResult consumeAndRotate(String raw);

  record RotationResult(UUID userId, String newRawRefresh, Instant expiresAt) {}
}
