package com.example.bookvopoisk.DTO;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record BookCreateRequest ( // данные присылает фронт для создания книги
  @NotBlank String title,
  @NotBlank String author,
  Integer year, List<String> genre,
  Integer pages,
  String description,
  String cover
) {}
