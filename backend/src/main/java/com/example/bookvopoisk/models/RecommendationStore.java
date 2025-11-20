package com.example.bookvopoisk.models;

import com.example.bookvopoisk.DTO.FavouriteBookDto;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RecommendationStore {
  private final Map<UUID, List<FavouriteBookDto>> data = new ConcurrentHashMap<>();

  public void save(UUID requestId, List<FavouriteBookDto> recs) {
    data.put(requestId, recs);
  }

  public Optional<List<FavouriteBookDto>> take(UUID requestId) {
    // можно вернуть и не удаляя: тогда замените на Optional.ofNullable(data.get(requestId))
    return Optional.ofNullable(data.remove(requestId));
  }
}
