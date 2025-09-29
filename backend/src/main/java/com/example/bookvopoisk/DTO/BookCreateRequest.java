package com.example.bookvopoisk.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record BookCreateRequest ( // данные присылает фронт для создания книги
  @NotBlank String title,
  @NotBlank String author,
  String year,
  String genre,
  String pages,
  String description,
  String cover,
  List<String> photos
) {}
