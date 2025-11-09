package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.models.Favorites;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorites, UUID> {

  @EntityGraph(attributePaths = {"book", "book.genres"})
  List<Favorites> findByUser_IdOrderByAddedAtDesc(UUID userId);
  boolean existsByUser_IdAndBook_Id(UUID userId, UUID bookId);
  void deleteByUser_IdAndBook_Id(UUID userId, UUID bookId);
}
