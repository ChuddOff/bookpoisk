package com.example.bookvopoisk.security_cfg;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
      http
        .csrf(csrf -> csrf.disable())                // не требуем CSRF-токен
        .cors(Customizer.withDefaults())             // используем corsConfigurationSource()
        .authorizeHttpRequests(auth -> auth
          .anyRequest().permitAll()                // разрешаем ВСЕ запросы без авторизации
        )
        .httpBasic(b -> b.disable())                 // убираем базовую авторизацию
        .formLogin(f -> f.disable());                // убираем форму логина
      return http.build();
    }

    // ВРЕМЕННО: разрешаем CORS всем источникам и методам.
    // Когда будет фронт-домен — заменишь на конкретные адреса.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
      CorsConfiguration cfg = new CorsConfiguration();
      cfg.setAllowedOriginPatterns(List.of("*"));      // можно поставить конкретные origin'ы позже
      cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
      cfg.setAllowedHeaders(List.of("*"));
      cfg.setAllowCredentials(true);                   // если будут куки/авторизация в будущем
      UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
      source.registerCorsConfiguration("/**", cfg);
      return source;
    }

    // Шифратор паролей на будущее (для пользователей/регистрации)
    @Bean
    public PasswordEncoder passwordEncoder() {
      return new BCryptPasswordEncoder();
    }
}
