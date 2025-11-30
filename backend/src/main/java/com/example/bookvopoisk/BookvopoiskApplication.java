package com.example.bookvopoisk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class BookvopoiskApplication {
	public static void main(String[] args) {
		SpringApplication.run(BookvopoiskApplication.class, args);
	}
}

