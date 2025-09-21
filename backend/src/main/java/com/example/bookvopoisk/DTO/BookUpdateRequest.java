package com.example.bookvopoisk.DTO;

import java.util.List;

public record BookUpdateRequest (
  String title,
  String author,
  Integer year,
  String genre,
  Integer pages,
  String description,
  String cover,
  List<String> photos
) {}
