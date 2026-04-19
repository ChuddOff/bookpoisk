package com.example.bookvopoisk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OpenDepositRequest(
        @NotNull Long fundingAccountId,
        @NotNull @DecimalMin("100.00") BigDecimal principal,
        @NotNull @DecimalMin("0.10") BigDecimal annualRate,
        @NotNull @Min(1) @Max(120) Integer durationMonths
) {
}
