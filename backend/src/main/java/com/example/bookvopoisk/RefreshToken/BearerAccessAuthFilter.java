package com.example.bookvopoisk.RefreshToken;

import com.example.bookvopoisk.googleRegistration.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@RequiredArgsConstructor
public class BearerAccessAuthFilter extends OncePerRequestFilter { // абстрактный класс в Spring Framework, который гарантирует, что ваш кастомный фильтр будет выполняться только один раз для каждого входящего HTTP-запроса
  private final JwtUtil jwtUtil;

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
    throws ServletException, IOException {
    String auth = req.getHeader("Authorization");
    if (auth == null || !auth.startsWith("Bearer ")) {
      chain.doFilter(req, resp); // валидный access → кладём аутентификацию в контекст → doFilter(...) → запрос пойдёт дальше, контроллер увидит «пользователь аутентифицирован»;
      return;
    }
    String token = auth.substring("Bearer ".length()).trim();
    try {
      var jws = jwtUtil.parse(token);               // если токен истёк, парсер кидает ExpiredJwtException до того, как ты что-то получишь (реализовано в JwtUtil)
      Claims c = jws.getPayload();

      UUID userId = UUID.fromString(c.getSubject());
      String username = c.get("username", String.class);

      // кладём аутентификацию — чтобы .authenticated() работало
      var authn = new UsernamePasswordAuthenticationToken(
        userId.toString(), // ← строка, тогда auth.getName() будет UUID-строкой
        null,
        Collections.emptyList()
      );
      SecurityContextHolder.getContext().setAuthentication(authn);
      // показали Spring, что теперь пользователь аутентифицирован
      chain.doFilter(req, resp); // валидный access → кладём аутентификацию в контекст → doFilter(...) → запрос пойдёт дальше, контроллер увидит «пользователь аутентифицирован»;
    } catch (ExpiredJwtException eje) {
      resp.setStatus(HttpStatus.UNAUTHORIZED.value());
      resp.setContentType("application/json");
      resp.getWriter().write("{\"error\":\"ACCESS_EXPIRED\"}");
    } catch (Exception e) {
      resp.setStatus(HttpStatus.UNAUTHORIZED.value());
      resp.setContentType("application/json");
      resp.getWriter().write("{\"error\":\"ACCESS_INVALID\"}");
    }
  }
}
