package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.models.AuthIdentity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, Long> {
  Optional<AuthIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);
}
