package com.example.bookvopoisk.dto;

import com.example.bookvopoisk.enums.AccountType;
import jakarta.validation.constraints.NotNull;

public record CreateAccountRequest(
        @NotNull AccountType type
) {
}
