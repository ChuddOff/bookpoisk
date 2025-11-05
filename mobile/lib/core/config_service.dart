class ConfigService {
  // Базовый URL твоего бэкенда
  static const String baseUrl = 'https://your-backend.com';

  // OAuth / OIDC настройки
  static const String clientId = 'YOUR_CLIENT_ID';
  static const String redirectUrl = 'com.example.app:/oauthredirect';
  static const String discoveryUrl =
      'https://your-backend.com/.well-known/openid-configuration';
  static const List<String> scopes = [
    'openid',
    'profile',
    'email',
    'offline_access',
  ];

  // Настройки HTTP
  static const int timeoutSeconds = 15;

  // Любые другие глобальные настройки приложения можно сюда добавлять
}
