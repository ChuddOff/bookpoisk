package com.example.bookvopoisk.DTO;

import java.util.List;
import java.util.UUID;

public record FavouriteBookDto(
  UUID id,
  String title,
  String author,
  Integer year,
  Integer pages,
  String cover,
  String description,
  List<String> genres
) {}
