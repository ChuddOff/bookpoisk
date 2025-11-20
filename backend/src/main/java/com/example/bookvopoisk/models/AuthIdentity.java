package com.example.bookvopoisk.models;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "auth_identity",
  uniqueConstraints = @UniqueConstraint(name = "uq_provider_sub", columnNames = {"provider", "provider_user_id"}))
@Getter
@Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AuthIdentity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private Users user;

  @Column(nullable = false, length = 32)
  private String provider;              // "google"

  @Column(name = "provider_user_id", nullable = false, length = 191)
  private String providerUserId;        // Google "sub"

  @Column(length = 320)
  private String email;                 // optional

  private Boolean emailVerified;        // optional
}
