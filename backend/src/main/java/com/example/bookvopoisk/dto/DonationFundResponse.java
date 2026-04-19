package com.example.bookvopoisk.dto;

import java.math.BigDecimal;

public record DonationFundResponse(
        Long id,
        String code,
        String title,
        BigDecimal collectedAmount,
        boolean active
) {
}
