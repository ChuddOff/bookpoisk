package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.models.AuthIdentity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, Long> {
  Optional<AuthIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);

  Optional<AuthIdentity> findByUserIdAndProvider(UUID userId, String provider);

  List<AuthIdentity> findAllByUserId(UUID userId);
}
