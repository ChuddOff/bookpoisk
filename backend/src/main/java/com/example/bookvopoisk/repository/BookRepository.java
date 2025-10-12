package com.example.bookvopoisk.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.bookvopoisk.models.Book;

import java.util.List;
import java.util.UUID;

// JpaSpecificationExecutor<Book> благодаря ему репозиторий умеет выполнять запросы по спецификациям: методы вроде findAll(Specification<Book> spec, Pageable pageable)
public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {

  @Query("""
        select distinct b.title
        from Book b
        where (:prefix is not null and :prefix <> '')
          and lower(trim(b.title)) like lower(concat(:prefix, '%'))
        order by b.title asc
    """)
  Page<String> suggestTitles(@Param("prefix") String prefix, Pageable pageable);

  @Query("""
        select distinct b.author
        from Book b
        where (:prefix is not null and :prefix <> '')
          and lower(trim(b.author)) like lower(concat(:prefix, '%'))
        order by b.author asc
    """)
  Page<String> suggestAuthors(@Param("prefix") String prefix, Pageable pageable);

  @Query("""
        select distinct trim(b.genre)
        from Book b
        where b.genre is not null and b.genre <> ''
        order by trim(b.genre) asc
  """)
  List<String> findAllGenres();

  /*
     Как работает метод:
     Фронт присылает количество необходимых ему книг и номер страницы.
     Если пагинация 0 => ему отдаются с 1 по 12.
     Если пользователь перелистнул на следующую страницу выдаются уже данные с 12 по 24.

     Под капотом (как пример):
     ORDER BY title ASC, id ASC
     LIMIT 12 OFFSET 24
     ORDER BY - отсортировал по возрастанию (ASC), ограничил до 12, после первых 24
     */

    // Если данные не указывались бд вернут данные как получилось
}
