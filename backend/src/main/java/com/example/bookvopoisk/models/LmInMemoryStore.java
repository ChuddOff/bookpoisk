package com.example.bookvopoisk.models;

import com.example.bookvopoisk.DTO.FavouriteBookDto;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Service
public class LmInMemoryStore {

  private final Map<UUID, List<List<FavouriteBookDto>>> cache = new ConcurrentHashMap<>();

  /** Сохранить исходный ответ LM для requestId. */
  public void save(UUID requestId, List<List<FavouriteBookDto>> recommendations) {
    if (recommendations == null) {
      cache.remove(requestId);
      return;
    }
    cache.put(requestId, recommendations);
  }

  /** Получить ответ LM; если ещё нет — вернётся Optional.empty() → PENDING. */
  public Optional<List<List<FavouriteBookDto>>> load(UUID requestId) {
    return Optional.ofNullable(cache.get(requestId));
  }

  /** (Опционально) удалить после использования, чтобы не плодить мусор. */
  public void remove(UUID requestId) {
    cache.remove(requestId);
  }
}
