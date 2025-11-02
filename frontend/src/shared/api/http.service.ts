// src/features/auth/auth.service.ts
import { http, httpAuth } from "./axios";
import { removeFromStorage, saveTokenStorage } from "../auth/session";
import { ENDPOINT } from "../config/endpoints";

export class AuthService {
  /**
   * Регистрация
   * @method POST
   * @param url
   * @returns SignupEntity
   * Приходит токен, он же записывается в cookie/storage через saveTokenStorage
   */

  /**
   * Обновление Access Token
   * Вызывается interceptors при ошибке 401 (и вручную при необходимости).
   * @method GET
   * @returns LoginEntity
   * Приходит токен, он же записывается в cookie/storage через saveTokenStorage
   */
  async refresh() {
    const res = await http.get<{ accessToken: string }>(ENDPOINT.auth.refresh);

    const token =
      (res?.data as any)?.accessToken ?? (res?.data as any)?.access ?? null;

    if (token) saveTokenStorage(token);

    return res;
  }

  /**
   * Логаут
   * @method GET
   * Только авторизованный пользователь может отправить.
   * Очищаем локальное хранилище токенов.
   */
  async logout() {
    return httpAuth.get(ENDPOINT.auth.logout).then((res) => {
      try {
        removeFromStorage();
      } catch {
        /* noop */
      }
      return res;
    });
  }
  async acceptOAuth(accessToken: string) {
    if (!accessToken) throw new Error("No access token provided");

    // Сохраняем токен (cookie согласно твоей реализации saveTokenStorage)
    try {
      saveTokenStorage(accessToken);
    } catch (e) {
      console.warn("saveTokenStorage failed", e);
    }

    // Устанавливаем дефолтный заголовок для httpAuth
    try {
      httpAuth.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;
    } catch (e) {
      console.warn("set default Authorization failed", e);
    }

    // Опционально: сразу получить профиль /auth/info, чтобы инициализировать сессию
    try {
      const profile = await httpAuth
        .get("/auth/info")
        .then((r) => r.data)
        .catch(() => null);
      return { token: accessToken, profile };
    } catch (e) {
      // не критично, вернём минимум
      return { token: accessToken, profile: null };
    }
  }
}

export const authService = new AuthService();
