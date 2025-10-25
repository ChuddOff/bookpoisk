package com.example.bookvopoisk.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "books")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Book {

  @Id
  @UuidGenerator(style = UuidGenerator.Style.RANDOM) // v4-like, неупорядоченно
  @EqualsAndHashCode.Include
  @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
  private UUID id;

  @NotBlank
  @Column(nullable = false)
  private String title;

  @NotBlank
  @Column(nullable = false, columnDefinition = "text")
  private String author;

  private Integer year;

  @Column(columnDefinition = "text")
  private String description;

  @ElementCollection
  @CollectionTable(
    name = "book_genres",
    joinColumns = @JoinColumn(name = "book_id"),
    uniqueConstraints = @UniqueConstraint(columnNames = {"book_id", "genre"})
  )
  @Column(name = "genre", nullable = false)
  private List<String> genres = new ArrayList<>();

  private String cover;

  @Positive
  private Integer pages;
}
