package com.example.bookvopoisk.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

import java.util.ArrayList;
import java.util.UUID;

@Entity
@Table(name = "books")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Book {
    @Id @GeneratedValue(strategy =  GenerationType.UUID)
    @EqualsAndHashCode.Include // аннотация Lombok, генерирует методы equals() и hashCode()
    private UUID id;

    @NotBlank @Column (nullable = false)
    private String title;

    @NotBlank @Column (nullable = false)
    private String author;

    @Column
    private Integer year;

    @Column (columnDefinition = "text") // Без ограничения в 255 символов
    private String description;

    @Column
    private String genre;

    @Column
    private String cover;

    // Наш массив размажется по базе данных, при этом каждое его значение будет прикреплено к id книги и будет находиться в конкретной строке
    @ElementCollection // Говорит JPA: поле tags хранится в отдельной таблице как набор простых значений (не сущности) (хранит одна строка = один элемент)
    @CollectionTable(name = "book_photos", joinColumns = @JoinColumn(name = "book_id")) // Коллекция принадлежит сущности book => по умолчанию ссылается на первичный ключ этой сущности
    @Column(name = "url")
    private List<String> photos = new ArrayList<>();

    @Positive // Числовое значение больше нуля
    private Integer pages;
}
