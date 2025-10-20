package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.models.AuthIdentity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, Long> {
  Optional<AuthIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);

  @EntityGraph(attributePaths = "user")
  Optional<AuthIdentity> findWithUserByProviderAndProviderUserId(String provider, String providerUserId);
}
