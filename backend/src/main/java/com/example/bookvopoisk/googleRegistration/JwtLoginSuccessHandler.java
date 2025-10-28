package com.example.bookvopoisk.googleRegistration;


import com.example.bookvopoisk.RefreshToken.RefreshService;
import com.example.bookvopoisk.models.Users;
import com.example.bookvopoisk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtLoginSuccessHandler implements AuthenticationSuccessHandler {

  private final UserRepository usersRepo;
  private final JwtUtil jwt;
  private final RefreshService refreshService;

  @Value("${app.auth.frontend-success-url}")
  private String frontendSuccessUrl;

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request,
                                      HttpServletResponse response,
                                      Authentication authentication) throws IOException {
    OAuth2User input = (OAuth2User) authentication.getPrincipal(); // Здесь principal — это тот самый объект AppUser, который ты вернул из loadUser
    UUID userId = UUID.fromString(input.getName());           // getName() = наш UUID (из AppOAuth2UserService, AppUser)
    Users user = usersRepo.findById(userId).orElseThrow(); // берем прямо из бд, куда уже все положили

    String access = jwt.generateAccess(user.getId(), user.getUsername()); // JwtUtil делает HS256-подписанный токен, где: sub = Users.id (UUID), кастомный клейм "username" = user.getUsername(), iat/exp — из текущего времени и access-ttl-seconds
    String refresh = refreshService.issue(user.getId());
    String redirect = frontendSuccessUrl
      + "#access=" + URLEncoder.encode(access, StandardCharsets.UTF_8)
      + "&refresh=" + URLEncoder.encode(refresh, StandardCharsets.UTF_8);
    // frontendSuccessUrl также берется из yml
    log.info("OAuth2 success for user {}", userId);
    response.sendRedirect(redirect); // Отправляется 302 на фронт.
    log.info("Redirect sent to {}", redirect);
  }
}
