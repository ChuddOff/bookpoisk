package com.example.bookvopoisk.googleRegistration;

import com.example.bookvopoisk.models.AuthIdentity;
import com.example.bookvopoisk.models.Users;
import com.example.bookvopoisk.repository.AuthIdentityRepository;
import com.example.bookvopoisk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppOAuth2UserService extends DefaultOAuth2UserService {

  private final UserRepository usersRepo;
  private final AuthIdentityRepository authRepo;

  @Override
  @Transactional
  public OAuth2User loadUser(OAuth2UserRequest req) {
    // Родитель (DefaultOAuth2UserService) использует access_token, идёт на userInfoUri
    // (из application.yml) и возвращает OAuth2User с атрибутами профиля (getAttributes()).
    OAuth2User input = super.loadUser(req);

    String provider = req.getClientRegistration().getRegistrationId(); // "google"
    Map<String, Object> a = input.getAttributes();
    String sub = (String) a.get("sub"); // sub — устойчивый ID пользователя у Google
    String email = (String) a.get("email"); // если у пользователя есть почта
    Boolean emailVerified = (Boolean) a.getOrDefault("email_verified", null); // если у пользователя есть разрешение


    // вызов Spring Data JPA, который делает SQL-запрос к таблице auth_identity (сущность AuthIdentity) по полям provider и provider_user_id.
    AuthIdentity auth = authRepo.findByProviderAndProviderUserId(provider, sub)
      .orElseGet(() -> {
        // Иначе создаем юзера
        Users u = new Users();
        String uname = (email != null ? email : "google:" + sub);
        if (uname.length() > 128) uname = uname.substring(0, 128);
        u.setUsername(uname);
        u.setActive(true);
        usersRepo.save(u);

        // Создаем AuthIdentity, привязанного к этому юзеру
        AuthIdentity ai = AuthIdentity.builder()
          .user(u)
          .provider(provider)
          .providerUserId(sub)
          .email(email)
          .emailVerified(emailVerified)
          .build();
        return authRepo.save(ai);
      });

    Users user = auth.getUser();
    String username = user.getUsername();

    // Актуализируем данные при повторных логинах, если у Google поменялся email/флаг верификации — обновляем.
    boolean dirty = false;
    if (email != null && !email.equals(auth.getEmail())) { auth.setEmail(email); dirty = true; } // при изменении email
    if (emailVerified != null && emailVerified != auth.getEmailVerified()) { auth.setEmailVerified(emailVerified); dirty = true; } // при изменении флага верификации
    if (dirty) authRepo.save(auth); // заново сохраняем

    return new AppUser(input, user.getId(), username);
  }

  // Я вернул в Spring экземпляр класса AppUser, в котором все методы переопределены так, как нам надо.

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
}

