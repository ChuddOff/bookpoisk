package com.example.bookvopoisk.Service;

import com.example.bookvopoisk.DTO.FavouriteBookDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LmPushService {

  private final RestClient restClient;
  private final String ingestPath;

  public LmPushService(
    @Value("${lm.url}") String lmBaseUrl,
    @Value("${lm.ingest-path}") String ingestPath,
    RestClient.Builder builder
  ) {
    this.restClient = builder.baseUrl(lmBaseUrl).build();
    this.ingestPath = ingestPath;
  }

  public List<FavouriteBookDto> callFavoritesAsDtos(UUID userId, List<FavouriteBookDto> books) {
    var payload = Map.of("userId", userId, "books", books);

    return restClient.post()
      .uri(ingestPath)
      .contentType(MediaType.APPLICATION_JSON)
      .body(payload)
      .retrieve()
      .body(new ParameterizedTypeReference<List<FavouriteBookDto>>() {});
  }
}
