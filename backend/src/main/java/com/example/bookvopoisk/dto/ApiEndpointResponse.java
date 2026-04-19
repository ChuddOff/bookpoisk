package com.example.bookvopoisk.dto;

public record ApiEndpointResponse(
        String method,
        String path,
        String description
) {
}
