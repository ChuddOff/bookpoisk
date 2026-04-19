package com.example.bookvopoisk.dto;

import com.example.bookvopoisk.enums.AccountType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AccountResponse(
        Long id,
        String accountNumber,
        AccountType type,
        BigDecimal balance,
        boolean active,
        OffsetDateTime createdAt
) {
}
