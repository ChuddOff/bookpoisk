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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
public class BearerAccessAuthFilter extends OncePerRequestFilter {
  private final JwtUtil jwtUtil;

  // ====================== РАБОТАЕТ И СЛАВА БОГУ =============================

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
    throws ServletException, IOException {

    log.debug("JWT-FILTER path={} method={} hasAuthHdr={}",
      req.getRequestURI(), req.getMethod(), req.getHeader("Authorization") != null);
    String auth = req.getHeader("Authorization");
    if (auth != null && auth.startsWith("Bearer ")) {
      String token = auth.substring(7).trim();
      if (token.length() >= 2 && token.charAt(0) == '"' && token.charAt(token.length() - 1) == '"') {
        token = token.substring(1, token.length() - 1);
      }
      // быстрый sanity-чек
      int dots = 0; for (int i = 0; i < token.length(); i++) if (token.charAt(i) == '.') dots++;
      if (dots != 2) { writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID", "NOT_JWT"); return; }

      // ---- ловим только ошибки ПАРСИНГА ----
      try {
        var jws = jwtUtil.parse(token);
        var c = jws.getPayload();
        UUID userId = UUID.fromString(c.getSubject()); // sub = локальный UUID
        var authn = new UsernamePasswordAuthenticationToken(userId.toString(), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authn);
        log.debug("JWT-FILTER OK userId={}", userId);
      } catch (ExpiredJwtException eje) {
        writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_EXPIRED", null); return;
      } catch (SignatureException se) {
        writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID", "BAD_SIGNATURE"); return;
      } catch (MalformedJwtException mje) {
        writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID", "MALFORMED"); return;
      } catch (IllegalArgumentException iae) {
        writeError(resp, HttpStatus.UNAUTHORIZED, "ACCESS_INVALID_SUBJECT", "SUB_NOT_UUID"); return;
      }
      // ---- конец блока парсинга ----

    }

    // ВСЕГДА пускаем дальше, чтобы не маскировать ошибки приложений
    chain.doFilter(req, resp);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
    String p = request.getRequestURI();
    return "/auth/refresh".equals(p); // refresh эндпоинт игнорим в access-фильтре
  }

  private void writeError(HttpServletResponse resp, HttpStatus status, String code, String reason) throws IOException {
    resp.setStatus(status.value());
    resp.setContentType("application/json;charset=UTF-8");
    String body = "{\"error\":\"" + code + "\"" + (reason != null ? ",\"reason\":\"" + reason + "\"" : "") + "}";
    resp.getWriter().write(body);
  }
}
