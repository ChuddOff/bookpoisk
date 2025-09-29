package com.example.bookvopoisk.DTO;

import org.springframework.data.domain.Page;

import java.util.LinkedHashMap;
import java.util.Map;

public class PageUtil {
  private PageUtil() {};
  public static <T> Map<String, Object> toPayload(Page<T> p) {
    int totalPages = p.getTotalPages();
    int last = Math.max(totalPages, 1);
    int current = (totalPages == 0) ? 1 : p.getNumber() + 1;
    Integer prev = current > 1 ? current - 1 : null;
    Integer next = current < last ? current + 1 : null;

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("data", p.getContent());
    payload.put("first", 1);
    payload.put("items", p.getTotalElements());
    payload.put("last", last);
    payload.put("next", next);
    payload.put("page", current);
    payload.put("prev", prev);

    return payload;
  }
}
