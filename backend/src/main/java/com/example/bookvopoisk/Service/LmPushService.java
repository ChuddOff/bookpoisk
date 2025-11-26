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

  public void requestAsync(UUID userId, List<FavouriteBookDto> favorites, String callbackUrl, UUID requestId) {
    var payload = Map.of(
      "userId", userId,
      "books", favorites,
      "callbackUrl", callbackUrl,
      "requestId", requestId.toString()
    );

    restClient.post()
      .uri(ingestPath)
      .contentType(MediaType.APPLICATION_JSON)
      .body(payload)
      .retrieve()
      .toBodilessEntity(); // LM сам потом позовёт коллбэк
  }
}
