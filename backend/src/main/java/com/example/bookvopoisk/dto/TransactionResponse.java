package com.example.bookvopoisk.dto;

import com.example.bookvopoisk.enums.TransactionType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TransactionResponse(
        Long id,
        Long fromAccountId,
        Long toAccountId,
        TransactionType type,
        BigDecimal amount,
        String description,
        OffsetDateTime createdAt
) {
}
