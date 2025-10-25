package com.example.bookvopoisk.DTO;

import java.util.List;

public record BookUpdateRequest ( // данные присылает фронт для обновления данных
  String title,
  String author, Integer year, List<String> genre, Integer pages,
  String description,
  String cover
) {}
