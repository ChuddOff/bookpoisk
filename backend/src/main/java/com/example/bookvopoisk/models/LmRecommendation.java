package com.example.bookvopoisk.models;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lm_recommendation")
public class LmRecommendation {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "request_id", nullable = false)
  private UUID requestId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "book_id", nullable = false)
  private Book book;

  @Column(name = "rank_order", nullable = false)
  private int rankOrder;

  @Column(name = "created_at", nullable = false, updatable = false)

  private Instant createdAt = Instant.now();

  // Getters, Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public UUID getRequestId() { return requestId; }
  public void setRequestId(UUID requestId) { this.requestId = requestId; }

  public UUID getUserId() { return userId; }
  public void setUserId(UUID userId) { this.userId = userId; }

  public Book getBook() { return book; }
  public void setBook(Book book) { this.book = book; }

  public int getRankOrder() { return rankOrder; }
  public void setRankOrder(int rankOrder) { this.rankOrder = rankOrder; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
