package com.example.bookvopoisk.googleRegistration;


import com.example.bookvopoisk.repository.AuthIdentityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
  private final AuthIdentityRepository authRepo;

  @Value("${app.auth.frontend-success-url}")
  private String frontendSuccessUrl;

  @Override
  @Transactional(readOnly = true)
  public void onAuthenticationSuccess(HttpServletRequest request,
                                      HttpServletResponse response,
                                      Authentication authentication) throws IOException {
    Object principal = authentication.getPrincipal();
    if (!(principal instanceof OAuth2User)) {
      throw new IllegalStateException("OAuth2 principal is not an OAuth2User: " + principal);
    }

    OAuth2User input = (OAuth2User) principal; // Здесь principal — это тот самый объект AppUser, который ты вернул из loadUser

    UUID userId;
    String username;

    if (principal instanceof AppOAuth2UserService.AppUser appUser) {
      userId = appUser.getUserId();
      username = appUser.getUsername();
    } else if (principal instanceof AppOAuth2UserService.AppOidcUser appUser) {
      userId = appUser.getUserId();
      username = appUser.getUsername();
    } else {
      String provider = null;
      if (authentication instanceof OAuth2AuthenticationToken token) {
        provider = token.getAuthorizedClientRegistrationId();
      }

      Object subAttr = input.getAttributes().get("sub");
      String providerUserId = subAttr != null ? subAttr.toString() : input.getName();

      if (provider == null || providerUserId == null) {
        throw new IllegalStateException("Cannot resolve OAuth2 identity for JWT generation");
      }

      var authIdentity = authRepo.findWithUserByProviderAndProviderUserId(provider, providerUserId)
        .orElseThrow(() -> new IllegalStateException("OAuth2 identity not found for provider=" + provider));

      var user = authIdentity.getUser();
      if (user == null) {
        throw new IllegalStateException("OAuth2 identity is missing a linked user");
      }

      userId = user.getId();
      username = user.getUsername();
    }

    String access = jwt.generateAccess(userId, username != null ? username : ""); // JwtUtil делает HS256-подписанный токен, где: sub = Users.id (UUID), кастомный клейм "username" = user.getUsername(), iat/exp — из текущего времени и access-ttl-seconds
    String redirect = frontendSuccessUrl + "#access=" + URLEncoder.encode(access, StandardCharsets.UTF_8);
    // frontendSuccessUrl также берется из yml
    response.sendRedirect(redirect); // Отправляется 302 на фронт.
  }
}

