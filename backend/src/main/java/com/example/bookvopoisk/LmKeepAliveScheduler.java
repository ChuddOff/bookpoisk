package com.example.bookvopoisk;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class LmKeepAliveScheduler {

  private final RestClient.Builder clientBuilder;

  @Value("${lm.url}")
  private String lmBaseUrl;

  // раз в 5 минут
  @Scheduled(fixedRate = 5 * 60 * 1000)
  public void pingLm() {
    try {
      RestClient client = clientBuilder.baseUrl(lmBaseUrl).build();
      var resp = client.get()
        .uri("/health")
        .retrieve()
        .toBodilessEntity();
      if (resp.getStatusCode().is2xxSuccessful()) {
        System.out.println("[LM KEEPALIVE] OK");
      } else {
        System.out.println("[LM KEEPALIVE] non-2xx: " + resp.getStatusCode());
      }
    } catch (Exception e) {
      System.out.println("[LM KEEPALIVE] error: " + e.getMessage());
    }
  }
}
