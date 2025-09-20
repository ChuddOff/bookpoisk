package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.models.Book;
import com.example.bookvopoisk.repository.BookRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {
    private final BookRepository repo;

    @GetMapping
    public Page<Book> list // Метод перехватывает данные из URL, либо если данных нет, выдает дефолтные значения, а дальше идет в BookRepository
            (@RequestParam(required = false) String q,
             @PageableDefault(size = 12, sort = "title")
             Pageable pageable) {
        return repo.search(q, pageable);
    }

    @GetMapping("/{id}") // Перехватываем id и достаем всю информацию о книге из бд
    public Book get(@PathVariable UUID id) {
        return repo.findById(id) // findById встроен в JPARepository и вернет сущность Book
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED) // Вернем 201 при успехе
    public Book create(@RequestBody @Valid Book body) { // Для добавления новой книги в бд
        body.setId(null); // Чтобы id создавался в бд
        return repo.save(body);
    }
}
