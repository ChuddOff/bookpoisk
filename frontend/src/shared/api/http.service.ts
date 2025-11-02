// src/features/auth/auth.service.ts
import { httpAuth } from "./axios";
import {
  getRefreshToken,
  removeFromStorage,
  saveTokenStorage,
} from "../auth/session";
import { ENDPOINT } from "../config/endpoints";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL as string;

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

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
    const refreshToken = getRefreshToken();

    const res = await client.post<{ accessToken: string }>(
      ENDPOINT.auth.refresh,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${refreshToken ?? ""}`,
        },
      }
    );

    const token = (res?.data as any)?.accessToken ?? null;
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
        .get("/auth/refresh")
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
