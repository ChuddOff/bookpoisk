package com.example.bookvopoisk.DTO;

import java.util.List;

public record BookUpdateRequest (
  String title,
  String author,
  String year,
  String genre,
  String pages,
  String description,
  String cover,
  List<String> photos
) {}
