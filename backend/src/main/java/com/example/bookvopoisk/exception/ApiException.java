package com.example.bookvopoisk.exception;

public class ApiException extends RuntimeException {
    public ApiException(String message) {
        super(message);
    }
}
