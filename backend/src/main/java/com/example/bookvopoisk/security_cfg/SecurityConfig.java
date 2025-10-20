package com.example.bookvopoisk.security_cfg;

import com.example.bookvopoisk.googleRegistration.AppOAuth2UserService;
import com.example.bookvopoisk.googleRegistration.JwtLoginSuccessHandler;
import com.example.bookvopoisk.googleRegistration.JwtUtil;
import com.example.bookvopoisk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final AppOAuth2UserService oAuth2UserService;
  private final JwtLoginSuccessHandler successHandler;
  private final JwtUtil jwt;
  private final UserRepository usersRepo;

  @Value("${app.cors.allowed-origins}") private String allowedOrigins;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.GET, "/", "/books/**", "/book/**", "/genres/**", "/books_ai").permitAll()
        .requestMatchers("/login**", "/oauth2/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/auth/me").permitAll()
        .anyRequest().authenticated()
      )
      .httpBasic(b -> b.disable())
      .formLogin(f -> f.disable())

      // куки JSESSIONID не нужны; контекст аутентификации живёт ровно в рамках запроса и создаётся заново для каждого запроса на основе токена.
      // отключаем их
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

      .oauth2Login(oauth -> oauth // включается весь механизм регистрации через Google, редирект на Google по считанным из application.yml данным
        // google возвращает данные, которые spring также проверяет на endpoint {baseUrl}/login/oauth2/code/google?code=...&state=...
        // далее spring делаем post запрос, прикладывая client_id, client_secret, code, redirect_uri
        // обратно приходит json и далее spring вызывает метод ниже
        .userInfoEndpoint(u -> u.userService(oAuth2UserService)) // обработка полученных данных
        // успех логина → редирект на фронт с твоим JWT (прописано в JwtLoginSuccessHandler)
        .successHandler(successHandler)
      );
    // Итого:
    // oauth2Login(...) — включает OAuth2/OIDC-логин.
    // .userInfoEndpoint(...) — настраивает этап “UserInfo” (когда после обмена code→tokens Spring идёт на Google UserInfo).
    // userService(...) указывает какую реализацию интерфейса OAuth2UserService<OAuth2UserRequest, OAuth2User> использовать.,
    // Это чисто серверный хук “обработать профиль, сопоставить с БД, вернуть principal”.

    http.addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    var cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true); // без кук; мы используем Bearer
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
// Проверка наличия JWT-токена, и если он есть, то пользователь является аутентифицированным и открывается доступ к определенным endpoint.
  @Bean
  public OncePerRequestFilter jwtAuthFilter() {
    return new OncePerRequestFilter() {
      @Override
      protected void doFilterInternal(HttpServletRequest request,
                                      HttpServletResponse response,
                                      FilterChain chain) throws ServletException, IOException {
        String auth = request.getHeader("Authorization"); // если он вида Bearer <jwt>, вырезает токен.
        if (auth != null && auth.startsWith("Bearer ")) {
          String token = auth.substring(7);
          try {
            var jws = jwt.parse(token); // если подпись/срок неверны — словится исключение, фильтр никого не аутентифицирует.
            UUID userId = UUID.fromString(jws.getPayload().getSubject()); // достаётся ID пользователя из токена:
            var user = usersRepo.findById(userId).orElse(null); // проверяет пользователя в БД:
            if (user != null && user.isActive()) {
              // кладёт аутентификацию в SecurityContext:
              var at = new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of());
              SecurityContextHolder.getContext().setAuthentication(at);
            }
          } catch (Exception ignored) {
          }
        }
        // Пропускает запрос дальше:
        chain.doFilter(request, response);
      }
    };
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
// Bearer — это тип схемы в заголовке Authorization HTTP, означающий: «у кого есть этот токен (кто его несёт), тот и считается авторизованным».
