package com.example.bookvopoisk.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.bookvopoisk.models.Book;
import java.util.UUID;


public interface BookRepository extends JpaRepository<Book, UUID> {
    @Query(""" 
            select b from Book b
            where (:q is null or trim(:q) = '')
               or lower(b.title)  like lower(concat('%', :q, '%'))
               or lower(b.author) like lower(concat('%', :q, '%'))
            """) // :q - именованный параметр JPQL, сюда подставляется значение из метода search(@Param("q")
                 // trim(:q) — функция, которая срезает пробелы в начале и в конце строки.

        // Сам запрос Query
    Page<Book> search(@Param("q") String q, Pageable pageable); // Метод, который будет обращаться в базу данных с помощью нашего Query
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