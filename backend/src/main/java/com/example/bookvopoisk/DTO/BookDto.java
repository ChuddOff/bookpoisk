package com.example.bookvopoisk.DTO;

import java.util.UUID;

public record BookDto(UUID id, String title, String author, String year, // record - Записи автоматически генерируют конструкторы, методы-аксессоры, а также методы equals(), hashCode() и toString()
                     String genre, String pages, String description, String cover, String photos) {}
