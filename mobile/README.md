# Bookpoisk Mobile (React Native)

Новая мобильная версия повторяет логику веб-клиента на React Native / Expo. 
Основной API базируется на том же бекенде, что и фронтенд (см. `EXPO_PUBLIC_API_URL`).

## Скрипты
- `npm start` — запуск Expo Dev Server
- `npm run android` / `npm run ios` / `npm run web` — платформа-специфичные точки входа

## Переменные окружения
Укажите `EXPO_PUBLIC_API_URL` (например, `https://api.example.com`) чтобы HTTP-клиент ходил к нужному бэкенду.

## Структура
- `src/api` — HTTP-клиент, сервисы и эндпоинты
- `src/screens` — экраны (Главная, Каталог, Книга, Избранное, Профиль)
- `src/components` — переиспользуемые UI-компоненты
- `src/providers` — React Query и auth-провайдер
- `src/hooks` — data hooks для книг, жанров и избранного

Токены доступа/обновления хранятся в `AsyncStorage` (см. `src/storage/tokens.ts`).
