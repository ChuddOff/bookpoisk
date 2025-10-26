package com.example.bookvopoisk.DTO;

import java.util.List;
import java.util.UUID;

public record BookDto(UUID id, String title, String author, Integer year,// record - Записи автоматически генерируют конструкторы, методы-аксессоры, а также методы equals(), hashCode() и toString()
                      List<String> genre, Integer pages, String description, String cover) {}
// выходной DTO
