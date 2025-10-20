package com.example.bookvopoisk.googleRegistration;

import com.example.bookvopoisk.models.AuthIdentity;
import com.example.bookvopoisk.models.Users;
import com.example.bookvopoisk.repository.AuthIdentityRepository;
import com.example.bookvopoisk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUserInfo;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppOAuth2UserService extends DefaultOAuth2UserService
  implements OAuth2UserService<OidcUserRequest, OidcUser> {

  private final UserRepository usersRepo;
  private final AuthIdentityRepository authRepo;
  private final OidcUserService oidcDelegate = new OidcUserService();

  @Override
  @Transactional
  public OAuth2User loadUser(OAuth2UserRequest req) {
    OAuth2User input = super.loadUser(req);
    String provider = req.getClientRegistration().getRegistrationId();
    UserContext ctx = syncUser(provider, input.getAttributes());
    return new AppUser(input, ctx.userId(), ctx.username());
  }

  @Override
  @Transactional
  public OidcUser loadUser(OidcUserRequest req) {
    OidcUser input = oidcDelegate.loadUser(req);
    String provider = req.getClientRegistration().getRegistrationId();
    UserContext ctx = syncUser(provider, input.getAttributes());
    return new AppOidcUser(input, ctx.userId(), ctx.username());
  }

  // OAuth2User - интерфейс с тремя методами. Все должны быть реализованы, необходимо переопределять Google sub на User.id
  public record AppUser(OAuth2User input, UUID userId, String username) implements OAuth2User {

    // пробрасывает все атрибуты Google (например, sub, email, email_verified
    @Override public Map<String, Object> getAttributes() { return input.getAttributes(); }
// ------- Работает и слава богу -------
    // Пробрасывает выданные авторитеты/роли. Сейчас они у тебя, по сути, дефолтные, но совместимость сохранена.
    @Override public Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
      return input.getAuthorities();
    }
// -------------------------------------
    @Override public String getName() { return userId.toString(); }
    public UUID getUserId() { return userId; }
    public String getUsername() { return username; }
  }

  public static class AppOidcUser extends DefaultOidcUser {
    private final UUID userId;
    private final String username;

    public AppOidcUser(OidcUser delegate, UUID userId, String username) {
      super(delegate.getAuthorities(), delegate.getIdToken(), resolveUserInfo(delegate));
      this.userId = userId;
      this.username = username;
    }

    @Override public String getName() { return userId.toString(); }
    public UUID getUserId() { return userId; }
    public String getUsername() { return username; }

    private static OidcUserInfo resolveUserInfo(OidcUser delegate) {
      OidcUserInfo info = delegate.getUserInfo();
      if (info != null) {
        return info;
      }
      return new OidcUserInfo(delegate.getAttributes());
    }
  }

  private UserContext syncUser(String provider, Map<String, Object> attributes) {
    String sub = (String) attributes.get("sub");
    if (sub == null) {
      throw new IllegalStateException("Missing 'sub' attribute in OAuth2 response");
    }
    String email = (String) attributes.get("email");
    Boolean emailVerified = (Boolean) attributes.getOrDefault("email_verified", null);

    AuthIdentity auth = authRepo.findByProviderAndProviderUserId(provider, sub)
      .orElseGet(() -> {
        Users u = new Users();
        String uname = (email != null ? email : provider + ":" + sub);
        if (uname.length() > 128) uname = uname.substring(0, 128);
        u.setUsername(uname);
        u.setActive(true);
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

    boolean dirty = false;
    if (email != null && !email.equals(auth.getEmail())) { auth.setEmail(email); dirty = true; }
    if (emailVerified != null && !emailVerified.equals(auth.getEmailVerified())) { auth.setEmailVerified(emailVerified); dirty = true; }
    if (dirty) authRepo.save(auth);

    Users user = auth.getUser();
    return new UserContext(user.getId(), user.getUsername());
  }

  private record UserContext(UUID userId, String username) {}
}
