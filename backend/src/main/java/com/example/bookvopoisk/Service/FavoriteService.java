package com.example.bookvopoisk.Service;

import com.example.bookvopoisk.DTO.FavouriteBookDto;
import com.example.bookvopoisk.models.Book;
import com.example.bookvopoisk.repository.FavoriteRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavoriteService {
  private final FavoriteRepository favoriteRepository;

  @Transactional(readOnly = true)
  public List<FavouriteBookDto> listFavouriteBooks(UUID userId) {
    return favoriteRepository.findByUser_IdOrderByAddedAtDesc(userId)
      .stream()
      .map(f -> toDto(f.getBook()))
      .toList();
  }

  private FavouriteBookDto toDto(Book b) {
    List<String> genres = (b.getGenres() == null)
      ? List.of()
      : List.copyOf(b.getGenres());

    return new FavouriteBookDto(
      b.getId(),
      b.getTitle(),
      b.getAuthor(),
      b.getYear(),
      b.getPages(),
      b.getCover(),
      b.getDescription(),
      genres
    );
  }
}
