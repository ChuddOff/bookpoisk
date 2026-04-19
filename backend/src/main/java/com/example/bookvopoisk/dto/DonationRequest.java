package com.example.bookvopoisk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record DonationRequest(
        @NotNull Long fromAccountId,
        @NotBlank String fundCode,
        @NotNull @DecimalMin("0.01") BigDecimal amount
) {
}
