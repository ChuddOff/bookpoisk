package com.example.bookvopoisk.RefreshToken;

import com.example.bookvopoisk.googleRegistration.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
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
public class BearerAccessAuthFilter extends OncePerRequestFilter {
  private final JwtUtil jwtUtil;

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
    throws ServletException, IOException {

    String auth = req.getHeader("Authorization");
    if (auth == null || !auth.startsWith("Bearer ")) {
      chain.doFilter(req, resp);
      return;
    }

    String token = auth.substring(7).trim();
    // срежем случайные кавычки: "aaa.bbb.ccc"
    if (token.length() >= 2 && token.charAt(0) == '"' && token.charAt(token.length() - 1) == '"') {
      token = token.substring(1, token.length() - 1);
    }
    // быстрый sanity-чек: JWT = 3 части
    int dots = 0;
    for (int i = 0; i < token.length(); i++) if (token.charAt(i) == '.') dots++;
    if (dots != 2) { writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID", "NOT_JWT"); return; }

    try {
      var jws = jwtUtil.parse(token);
      Claims c = jws.getPayload();

      String sub = c.getSubject();
      UUID userId;
      try {
        userId = UUID.fromString(sub); // ожидаем sub = локальный UUID пользователя
      } catch (IllegalArgumentException iae) {
        writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID_SUBJECT", "SUB_NOT_UUID");
        return;
      }

      var authn = new UsernamePasswordAuthenticationToken(userId.toString(), null, Collections.emptyList());
      SecurityContextHolder.getContext().setAuthentication(authn);
      chain.doFilter(req, resp);

    } catch (ExpiredJwtException eje) {
      writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_EXPIRED", null);
    } catch (SignatureException se) {
      writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID", "BAD_SIGNATURE");
    } catch (MalformedJwtException mje) {
      writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID", "MALFORMED");
    } catch (Exception e) {
      writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID", e.getClass().getSimpleName());
    }
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    // не фильтруем preflight, чтобы не мешать CORS
    return "OPTIONS".equalsIgnoreCase(request.getMethod());
  }

  private void writeError(HttpServletResponse resp, HttpStatus status, String code, String reason) throws IOException {
    resp.setStatus(status.value());
    resp.setContentType("application/json;charset=UTF-8");
    String body = "{\"error\":\"" + code + "\"" + (reason != null ? ",\"reason\":\"" + reason + "\"" : "") + "}";
    resp.getWriter().write(body);
  }
}
