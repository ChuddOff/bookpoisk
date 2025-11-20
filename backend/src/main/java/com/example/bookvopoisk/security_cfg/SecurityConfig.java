package com.example.bookvopoisk.security_cfg;

import com.example.bookvopoisk.RefreshToken.BearerAccessAuthFilter;
import com.example.bookvopoisk.googleRegistration.AppOAuth2UserService;
import com.example.bookvopoisk.googleRegistration.AppOidcUserService;
import com.example.bookvopoisk.googleRegistration.JwtLoginSuccessHandler;
import com.example.bookvopoisk.googleRegistration.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;



import jakarta.servlet.http.HttpServletResponse;


import java.util.List;
;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final AppOidcUserService appOidcUserService;
  private final AppOAuth2UserService appOAuth2UserService;
  private final JwtLoginSuccessHandler successHandler;
  private final JwtUtil jwt;

  @Value("${app.cors.allowed-origins:https://bookpoisk.vercel.app,http://localhost:5173}")
  private String allowedOrigins;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/", "/books/**", "/book/**", "/genres/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
        .requestMatchers("/login**", "/oauth2/**").permitAll()
        .anyRequest().authenticated()
      )
      .httpBasic(b -> b.disable())
      .formLogin(f -> f.disable())
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .oauth2Login(oauth -> oauth
        .userInfoEndpoint(u -> u
          .oidcUserService(appOidcUserService)
          .userService(appOAuth2UserService)
        )
        .successHandler(successHandler)
      )
      // Единственный JWT-фильтр:
      .addFilterBefore(new BearerAccessAuthFilter(jwt), UsernamePasswordAuthenticationFilter.class)
      .exceptionHandling(ex -> ex.authenticationEntryPoint((req, resp, e) -> {
        if (!resp.isCommitted()) {
          resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
          resp.setContentType("application/json");
          resp.getWriter().write("{\"error\":\"UNAUTHORIZED\"}");
        }
      }));

    return http.build();
  }

  // Какие сайты могут слать запрос на мой backend
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    var cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(
      "https://bookpoisk.vercel.app", "http://localhost:5173"
    ));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    // явно разреши Authorization
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
    // ничего не читаем из Set-Cookie → credentials НЕ нужны
    cfg.setAllowCredentials(false);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
// Проверка наличия JWT-токена, и если он есть, то пользователь является аутентифицированным и открывается доступ к определенным endpoint.


  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
// Bearer — это тип схемы в заголовке Authorization HTTP, означающий: «у кого есть этот токен (кто его несёт), тот и считается авторизованным».
// надеюсь fix
