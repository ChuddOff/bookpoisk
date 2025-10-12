package com.example.bookvopoisk.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Здесь хранится: id строчки, id юзера из Users, id книги из Book, дата добавления в избранное
@Entity
@Table(
  name = "favorite",
  uniqueConstraints = @UniqueConstraint(
    name = "uq_favorite_user_book",
    columnNames = {"user_id","book_id"}
  ))
@Getter @Setter
public class Favorites {
  @Id
  @GeneratedValue
  private UUID id;

  // Идет ссылка на Users, а там @Id, соотв. привязывается user_id здесь к той @Id
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private Users user;

  // Аналогично предыдущему
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "book_id", nullable = false)
  private Book book;

  @Column(nullable = false)
  private Instant addedAt = Instant.now();
}
