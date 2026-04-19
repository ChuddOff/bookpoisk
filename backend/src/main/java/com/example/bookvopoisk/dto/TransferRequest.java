package com.example.bookvopoisk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record TransferRequest(
        @NotNull Long fromAccountId,
        @NotBlank @Size(max = 20) String toAccountNumber,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @Size(max = 280) String description,
        @NotBlank String oneTimeCode
) {
}
