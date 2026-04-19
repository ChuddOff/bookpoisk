package com.example.bookvopoisk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DepositResponse(
        Long id,
        Long fundingAccountId,
        BigDecimal principal,
        BigDecimal annualRate,
        Integer durationMonths,
        LocalDate startDate,
        LocalDate maturityDate,
        BigDecimal projectedPayout
) {
}
