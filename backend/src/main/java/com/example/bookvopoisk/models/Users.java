package com.example.bookvopoisk.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
  name = "users",
  uniqueConstraints = @UniqueConstraint(
    name = "uq_users_username",
    columnNames = "username"
  )
)
@Getter
@Setter
public class Users {
  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(nullable = false, length=128)
  private String username;

  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @CreationTimestamp // аннотация Hibernate, которая автоматически проставляет время создания записи при первом INSERT
  @Column(nullable = false, updatable = false)
  private Instant createdAt; // класс из java.time, представляющий момент времени в UTC с точностью до наносекунд

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;
}
