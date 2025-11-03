package com.example.bookvopoisk.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.UUID;

public record LikeRequest(
  @JsonAlias({"id","bookId"}) UUID id,
  Data data
) {
  public UUID effectiveId() {
    if (id != null) return id;
    return (data != null ? data.id() : null);
  }
  public static record Data(@JsonAlias({"id","bookId"}) UUID id) {}
}
