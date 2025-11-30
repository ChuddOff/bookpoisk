package com.example.bookvopoisk.specifications;

import com.example.bookvopoisk.models.Book;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.List;

public class BookSpecifications { // Фабрика кусочков Where, которые я впоследствии применю в findALL от JpaSpecificationExecutor
  private BookSpecifications() {
  }

  public static Specification<Book> titleContains(String q) {
    return (root, cq, cb) -> {
      if (q == null || q.isBlank()) return null;
      String needle = q.toLowerCase().trim();
      // Это интерфейс, который расширяет Selection<T>.
      // Значит, любое Expression<T> можно и выбирать (SELECT expr), и использовать в WHERE/ORDER BY.
      // Значит, любое Expression<T> можно и выбирать (SELECT expr), и использовать в WHERE/ORDER BY.
      Expression<String> title = cb.lower(root.get("title"));

      // Паттерны
      String start = needle + "%";
      String end   = "%" + needle;
      String any   = "%" + needle + "%";

      // Фильтр: хотя бы где-то встречается
      Predicate where = cb.like(title, any);

      Expression<Integer> rank =
        cb.selectCase()
        .when(cb.like(title, start), 0)
        .when(
          cb.and(
            cb.like(title, any),
            cb.notLike(title, start),
            cb.notLike(title, end)
          ), 1)
        .when(cb.like(title, end), 2)
        .otherwise(3).as(Integer.class);

      // Вспомогательная сортировка: чем левее вхождение — тем раньше
      Expression<Integer> pos = cb.locate(title, needle);

      cq.orderBy(cb.asc(rank), cb.asc(pos), cb.asc(title));

      return where;
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

  /** Книга содержит хотя бы один из переданных жанров (case-insensitive). */
  public static Specification<Book> genresAnyIgnoreCase(Collection<String> genres) {
    return (root, cq, cb) -> {
      if (genres == null || genres.isEmpty()) return null;

      Join<Book, String> g = root.join("genres", JoinType.INNER);

      List<String> wanted = genres.stream()
        .filter(s -> s != null && !s.isBlank())
        .map(s -> s.toLowerCase().trim())
        .distinct()
        .toList();
      if (wanted.isEmpty()) return null;
      // Перевод полученных значений жанра в нижний регистр, проверка, что жанр входит в wanted
      Predicate p = cb.lower(g).in(wanted); // Predicate в JPA Criteria — это логическое выражение (булевское), т.е. «условие», которое пойдёт в WHERE / HAVING / ON.
      cq.distinct(true); // Сущности не дублируются при выдаче
      return p;
    };
  }

  /** Год в диапазоне [from, to] (любой из краёв может отсутствовать). */
  public static Specification<Book> yearBetween(Integer yearFrom, Integer yearTo) {
    return (root, cq, cb) -> {
      Path<Integer> years = root.get("year");
      if (yearFrom == null && yearTo == null) return null;
      if (yearFrom != null && yearTo != null) return cb.between(years, yearFrom, yearTo);
      return (yearFrom != null)
        ? cb.greaterThanOrEqualTo(years, yearFrom)
        : cb.lessThanOrEqualTo(years, yearTo);
    };
  }

  /** Страницы в диапазоне [from, to] (любой из краёв может отсутствовать). */
  public static Specification<Book> pageBetween(Integer pageFrom, Integer pageTo) {
    return (root, cq, cb) -> {
      Path<Integer> pages = root.get("pages");
      if (pageFrom == null && pageTo == null) return null;
      if (pageFrom == null) return cb.lessThanOrEqualTo(pages, pageTo);
      if (pageTo == null) return cb.greaterThanOrEqualTo(pages, pageFrom);
      return cb.between(pages, pageFrom, pageTo);
    };
  }
  public static Specification<Book> authorOrTitleContains(String q) {
    return (root, cq, cb) -> {
      if (q == null || q.isBlank()) return null;

      String needle = q.toLowerCase().trim();

      Expression<String> title  = cb.lower(root.get("title"));
      Expression<String> author = cb.lower(root.get("author"));

      String start = needle + "%";
      String end   = "%" + needle;
      String any   = "%" + needle + "%";

      // где вообще есть вхождение
      var inAuthor = cb.like(author, any);
      var inTitle  = cb.like(title, any);
      Predicate where = cb.or(inAuthor, inTitle);

      Expression<Integer> rank =
        cb.selectCase()
          .when(cb.like(author, start), 0)
          .when(cb.like(author, any), 1)
          .when(cb.like(title, start), 2)
          .when(
            cb.and(
              cb.like(title, any),
              cb.notLike(title, start),
              cb.notLike(title, end)
            ), 3)
          .when(cb.like(title, end), 4)
          .otherwise(5)
          .as(Integer.class);

      Expression<Integer> posAuthor = cb.locate(author, needle);
      Expression<Integer> posTitle  = cb.locate(title,  needle);

      cq.orderBy(
        cb.asc(rank),
        cb.asc(posAuthor),
        cb.asc(posTitle),
        cb.asc(author),
        cb.asc(title)
      );

      return where;
    };
  }

}
