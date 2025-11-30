package com.example.bookvopoisk.models;

import com.example.bookvopoisk.DTO.FavouriteBookDto;
import com.example.bookvopoisk.repository.BookRepository;
import com.example.bookvopoisk.repository.LmRecommendationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecommendationStore {

  private final LmRecommendationRepository lmRepo;
  private final BookRepository bookRepository;

  @Transactional
  public void save(UUID requestId, UUID userId, List<FavouriteBookDto> recs) {
    int order = 0;
    for (FavouriteBookDto dto : recs) {
      var book = bookRepository.findById(dto.id())
        .orElseThrow(() -> new IllegalArgumentException("Book not found: " + dto.id()));

      var entity = new LmRecommendation();
      entity.setRequestId(requestId);
      entity.setUserId(userId);
      entity.setBook(book);
      entity.setRankOrder(order++);
      lmRepo.save(entity);
    }
  }

  @Transactional
  public Optional<List<FavouriteBookDto>> load(UUID requestId) {
    var entities = lmRepo.findByRequestIdOrderByRankOrderAsc(requestId);
    if (entities.isEmpty()) {
      return Optional.empty(); // трактуем как PENDING
    }

    var result = entities.stream()
      .map(rec -> {
        var b = rec.getBook();
        return new FavouriteBookDto(
          b.getId(),
          b.getTitle(),
          b.getAuthor(),
          b.getYear(),
          b.getPages(),
          b.getCover(),
          b.getDescription(),
          b.getGenres()
        );
      })
      .toList();

    return Optional.of(result);
  }
}
