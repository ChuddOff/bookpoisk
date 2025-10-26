// РАБОТАЕТ И СЛАВА БОГУ
package com.example.bookvopoisk.googleRegistration;

import com.example.bookvopoisk.models.AuthIdentity;
import com.example.bookvopoisk.models.Users;
import com.example.bookvopoisk.repository.AuthIdentityRepository;
import com.example.bookvopoisk.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppOidcUserService extends OidcUserService {

  private final UserRepository usersRepo;
  private final AuthIdentityRepository authRepo;

  @Override
  @Transactional
  public OidcUser loadUser(OidcUserRequest req) {
    OidcUser input = super.loadUser(req); // сходили за id_token/userinfo

    String provider = req.getClientRegistration().getRegistrationId(); // "google"
    Map<String, Object> a = input.getAttributes();
    String sub = (String) a.get("sub");
    String email = (String) a.get("email");
    Boolean emailVerified = (Boolean) a.getOrDefault("email_verified", null);
    String picture = (String) a.get("picture");

    AuthIdentity auth = authRepo.findByProviderAndProviderUserId(provider, sub)
      .orElseGet(() -> {
        Users u = new Users();
        String uname = (email != null ? email : "google:" + sub);
        if (uname.length() > 128) uname = uname.substring(0, 128);
        u.setUsername(uname);
        u.setActive(true);
        u.setAvatarUrl(picture);
        usersRepo.save(u);

        AuthIdentity ai = AuthIdentity.builder()
          .user(u)
          .provider(provider)
          .providerUserId(sub)
          .email(email)
          .emailVerified(emailVerified)
          .build();
        return authRepo.save(ai);
      });

    Users u = auth.getUser();
    boolean dirtyAuth = false;
    boolean dirtyUser = false;

    if (email != null && !email.equals(auth.getEmail())) {
      auth.setEmail(email);
      dirtyAuth = true;
    }
    if (emailVerified != null && !emailVerified.equals(auth.getEmailVerified())) {
      auth.setEmailVerified(emailVerified);
      dirtyAuth = true;
    }
    if (picture != null && !picture.equals(u.getAvatarUrl())) {
      u.setAvatarUrl(normalizePictureUrl(picture));
      dirtyUser = true;
    }

    if (dirtyAuth) authRepo.save(auth);
    if (dirtyUser) usersRepo.save(u);

    // Возвращаем ОДИН principal: наш, но реализующий OidcUser
    return new AppOidcUser(input, auth.getUser().getId());
  }
  // Изменение формата фото
  private String normalizePictureUrl(String url) {
    if (url == null) return null;
    // простая замена s96 -> s256, если формат как у Google
    return url.replace("=s96-", "=s256-");
  }

  public record AppOidcUser(OidcUser input, UUID userId) implements OidcUser {
    @Override public Map<String, Object> getAttributes() { return input.getAttributes(); }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return input.getAuthorities(); }
    @Override public Map<String, Object> getClaims() { return input.getClaims(); }
    @Override public OidcUserInfo getUserInfo() { return input.getUserInfo(); }
    @Override public OidcIdToken getIdToken() { return input.getIdToken(); }
    @Override public String getName() { return userId.toString(); } // <-- КЛЮЧЕВОЕ
    public UUID getUserId() { return userId; }
  }
}
