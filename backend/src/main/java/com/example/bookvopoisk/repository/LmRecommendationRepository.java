package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.models.LmRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface LmRecommendationRepository extends JpaRepository<LmRecommendation, Long> {
  List<LmRecommendation> findByRequestIdOrderByRankOrderAsc(UUID requestId);
  void deleteByRequestId(UUID requestId);
}
