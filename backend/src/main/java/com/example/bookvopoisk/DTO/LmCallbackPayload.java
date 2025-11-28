package com.example.bookvopoisk.DTO;

import java.util.List;
import java.util.UUID;

public record LmCallbackPayload(
  UUID userId,
  List<FavouriteBookDto> recommendations)
{}
