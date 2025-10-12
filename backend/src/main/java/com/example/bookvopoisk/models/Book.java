package com.example.bookvopoisk.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

  private String year;

  @Column(columnDefinition = "text")
  private String description;

  private String genre;
  private String cover;

  @ElementCollection
  @CollectionTable(name = "book_photos", joinColumns = @JoinColumn(name = "book_id"))
  @Column(name = "url")
  private List<String> photos = new ArrayList<>();

  // Строка — ок, но сортировка будет лексикографической.
  // Можно тоже повесить валидатор, если нужны только цифры.
  @Pattern(regexp = "^\\d+$", message = "Pages must be digits")
  private String pages;
}
