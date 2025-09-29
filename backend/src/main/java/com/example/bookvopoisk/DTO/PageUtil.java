package com.example.bookvopoisk.DTO;

import org.springframework.data.domain.Page;

import java.util.Map;

public class PageUtil {
  private PageUtil() {};
  public static <T> Map<String, Object> toPayload(Page<T> p) {
    int totalPages = p.getTotalPages();
    int last = Math.max(totalPages, 1);
    int current = (totalPages == 0) ? 1 : p.getNumber() + 1;
    Integer prev = current > 1 ? current - 1 : null;
    Integer next = current < last ? current + 1 : null;

    return Map.of(
      "data", p.getContent(),
      "first", 1,
      "items", p.getTotalElements(),
      "last", last,
      "next", next,
      "page", current,
      "prev", prev
    );
  }
}
