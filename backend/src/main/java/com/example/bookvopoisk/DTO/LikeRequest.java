package com.example.bookvopoisk.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.UUID;

public record LikeRequest(@JsonAlias({"id","bookId"}) UUID id) {}
