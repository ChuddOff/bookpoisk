package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.DTO.BookDto;
import com.example.bookvopoisk.models.Favorites;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.util.List;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorites, UUID> {
  @Query("""
    select new com.example.bookvopoisk.DTO.BookDto(
      b.id, b.title, b.author, b.year, b.genre, b.pages, b.description, b.cover
    )
    from Favorites f
    join f.book b
    where f.user.id = :userId
    order by f.addedAt desc
  """)
  List<BookDto> findFavoriteBooksByUserId(@Param("userId") UUID userId);

  boolean existsByUser_IdAndBook_Id(UUID userId, UUID bookId);
  void deleteByUser_IdAndBook_Id(UUID userId, UUID bookId);
}
