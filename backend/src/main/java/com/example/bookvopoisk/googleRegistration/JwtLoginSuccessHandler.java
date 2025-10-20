package com.example.bookvopoisk.googleRegistration;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtLoginSuccessHandler implements AuthenticationSuccessHandler {

  private final JwtUtil jwt;

  @Value("${app.auth.frontend-success-url}")
  private String frontendSuccessUrl;

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request,
                                      HttpServletResponse response,
                                      Authentication authentication) throws IOException {
    Object principal = authentication.getPrincipal();
    OAuth2User input = (OAuth2User) principal; // Здесь principal — это тот самый объект AppUser, который ты вернул из loadUser

    UUID userId;
    String username;

    if (principal instanceof AppOAuth2UserService.AppUser appUser) {
      userId = appUser.getUserId();
      username = appUser.getUsername();
    } else {
      userId = UUID.fromString(input.getName()); // getName() = наш UUID (из AppOAuth2UserService, AppUser)
      username = input.getAttribute("email");
    }

    String access = jwt.generateAccess(userId, username != null ? username : ""); // JwtUtil делает HS256-подписанный токен, где: sub = Users.id (UUID), кастомный клейм "username" = user.getUsername(), iat/exp — из текущего времени и access-ttl-seconds
    String redirect = frontendSuccessUrl + "#access=" + URLEncoder.encode(access, StandardCharsets.UTF_8);
    // frontendSuccessUrl также берется из yml
    response.sendRedirect(redirect); // Отправляется 302 на фронт.
  }
}

