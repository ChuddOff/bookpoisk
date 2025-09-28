package com.example.bookvopoisk.specifications;

import com.example.bookvopoisk.models.Book;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;

public class BookSpecifications { // Фабрика кусочков Where, которые я впоследствии применю в findALL от JpaSpecificationExecutor
  private BookSpecifications() {
  }

  public static Specification<Book> titleContains(String q) {
    return (root, cq, cb) -> {
      if (q == null || q.isBlank()) return null;
      String p = "%" + q.toLowerCase().trim() + "%";
      return cb.like(cb.lower(root.get("title")), p);
    };
  }

  /** Фильтр по нескольким авторам (case-insensitive). */
  public static Specification<Book> authorInIgnoreCase(Collection<String> authors) {
    return (root, cq, cb) -> {
      if (authors == null || authors.isEmpty()) return null;
      var lowerAuthor = cb.lower(root.get("author"));
      return authors.stream()
        .filter(s -> s != null && !s.isBlank())
        .map(s -> cb.equal(lowerAuthor, s.toLowerCase().trim()))
        .reduce(cb::or)
        .orElse(null);
    };
  }

  /** Фильтр по нескольким жанрам (case-insensitive). */
  public static Specification<Book> genreInIgnoreCase(Collection<String> genres) {
    return (root, cq, cb) -> {
      if (genres == null || genres.isEmpty()) return null;
      var lowerGenre = cb.lower(root.get("genre"));
      return genres.stream()
        .filter(s -> s != null && !s.isBlank())
        .map(s -> cb.equal(lowerGenre, s.toLowerCase().trim()))
        .reduce(cb::or)
        .orElse(null);
    };
  }

  /** Год в диапазоне [from, to] (любой из краёв может отсутствовать). */
  public static Specification<Book> yearBetween(Integer from, Integer to) {
    return (root, cq, cb) -> {
      if (from == null && to == null) return null;
      if (from != null && to != null) return cb.between(root.get("year"), from, to);
      return (from != null)
        ? cb.greaterThanOrEqualTo(root.get("year"), from)
        : cb.lessThanOrEqualTo(root.get("year"), to);
    };
  }
}
