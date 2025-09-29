package com.example.bookvopoisk.Mapper;

import com.example.bookvopoisk.DTO.BookCreateRequest;
import com.example.bookvopoisk.DTO.BookDto;
import com.example.bookvopoisk.DTO.BookUpdateRequest;
import com.example.bookvopoisk.models.Book;
import lombok.AllArgsConstructor;

import java.util.List;

@AllArgsConstructor
public class BookMapper {
  public static BookDto toDto (Book e) {
    if (e == null) return null;
    return new BookDto (
      e.getId(),
      e.getTitle(),
      e.getAuthor(),
      e.getYear(),
      e.getGenre(),
      e.getPages(),
      e.getDescription(),
      e.getCover(),
      String.join(",", e.getPhotos())
    );
  }

  public static Book fromCreate(BookCreateRequest r) {
    Book b = new Book();
    applyUpdate(b,  r.title(), r.author(), r.year(), r.genre(), r.pages(),
      r.description(), r.cover(), r.photos());
    return b;
  }

  public static void applyUpdate(Book b, BookUpdateRequest r) {
    applyUpdate(b, r.title(), r.author(), r.year(), r.genre(), r.pages(),
      r.description(), r.cover(), r.photos());
  }

  private static void applyUpdate (Book b, String title, String author, String year, //
                                   String genre, String pages, String description,
                                   String cover, List<String> photos) {
    if (title != null) b.setTitle(title);
    if (author != null) b.setAuthor(author);
    if (year != null) b.setYear(year);
    if (genre != null) b.setGenre(genre);
    if (pages != null) b.setPages(pages);
    if (description != null) b.setDescription(description);
    if (cover != null) b.setCover(cover);
    if (photos != null) b.setPhotos(photos);
  }
}
