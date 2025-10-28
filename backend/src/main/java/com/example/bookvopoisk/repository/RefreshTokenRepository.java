package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.models.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
  Optional<RefreshToken> findByRefreshTokenHash(String refreshTokenHash); // findBy + имя поля в сущности

  @Modifying(clearAutomatically = true, flushAutomatically = true) // Сообщает Spring Data, что запрос изменяет данные, clearAutomatically=true очистит persistence context после апдейта, чтобы в кэше не остались устаревшие сущности.
  // Обновляет все строки сущности RefreshToken, где:
  // r.user.id = :userId — токен принадлежит этому пользователю;
  // r.revoked = false — токен ещё активен.
  @Query("update RefreshToken r set r.revoked = true where r.user.id = :userId and r.revoked = false")
  int revokeAllActiveByUserId(@Param("userId") UUID userId);

  @Modifying
  @Query("delete from RefreshToken r where r.expiresAt < :now")
  int deleteAllExpired(@Param("now") Instant now);
}
