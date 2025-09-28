package com.example.bookvopoisk.controllers;

import com.example.bookvopoisk.models.Book;
import com.example.bookvopoisk.repository.BookRepository;
import com.example.bookvopoisk.specifications.BookSpecifications;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.data.jpa.domain.Specification.unrestricted;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class BookController {
  private final BookRepository repo;

  /** Каталог: q только по title; авторы/жанры — списки; год — диапазон. */
  @GetMapping("/books")
  public Page<Book> list(
    @RequestParam(required = false) String q,
    @RequestParam(required = false) List<String> authors,
    @RequestParam(required = false) List<String> genres,
    @RequestParam(required = false) Integer yearFrom,
    @RequestParam(required = false) Integer yearTo,
    @PageableDefault(size = 12, sort = "title") Pageable pageable
  ) {
    Specification<Book> spec = Specification.allOf(
      BookSpecifications.titleContains(q),
      BookSpecifications.authorInIgnoreCase(authors),
      BookSpecifications.genreInIgnoreCase(genres),
      BookSpecifications.yearBetween(yearFrom, yearTo)
    );

    return repo.findAll(spec, pageable);
  }

  /** Подсказки по названиям: для строки поиска. */
  @GetMapping("/books/titles/suggest")
  public Page<String> suggestTitles(
    @RequestParam String q,
    @PageableDefault(size = 10) Pageable pageable
  ) {
    return repo.suggestTitles(q.trim(), pageable);
  }

  /** Подсказки по авторам: для критериев. */
  @GetMapping("/books/authors/suggest")
  public Page<String> suggestAuthors(
    @RequestParam String q,
    @PageableDefault(size = 10) Pageable pageable
  ) {
    return repo.suggestAuthors(q.trim(), pageable);
  }

  @GetMapping("/books/{id}")
  public Book get(@PathVariable UUID id) {
    return repo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  @PostMapping("/books")
  @ResponseStatus(HttpStatus.CREATED)
  public Book create(@RequestBody @Valid Book body) {
    body.setId(null);
    return repo.save(body);
  }
}
