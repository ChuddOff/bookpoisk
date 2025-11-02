// src/features/auth/auth.service.ts
import { httpAuth } from "./axios";
import {
  getRefreshToken,
  removeFromStorage,
  saveTokenStorage,
} from "../auth/session";
import { ENDPOINT } from "../config/endpoints";
import axios from "axios";
import { useSWRConfig } from "swr";
import { useNavigate } from "react-router-dom";
import { useMe } from "@/entities/user";

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

    const client = axios.create({
      baseURL: import.meta.env.VITE_API_URL as string, // тот же BASE_URL, что в src/shared/api/axios.ts
      withCredentials: false, // у тебя в axios.ts стоит withCredentials: false для Bearer-only
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // ставим refresh в Authorization — как ожидает бэкенд
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    const res = await client.post(ENDPOINT.auth.refresh, undefined);

    // Приводим к ожидаемой форме: bэк может вернуть { accessToken } или { access }
    const data = (res && (res.data ?? {})) as any;
    const access = data.accessToken ?? data.access ?? data.access_token ?? null;

    if (!access) {
      // Если ответ неожиданный — считаем это ошибкой
      throw new Error("REFRESH_FAILED_NO_ACCESS");
    }

    // Сохраняем новый access (функция сохраняет в localStorage, как ты просил)
    try {
      saveTokenStorage(access);
    } catch {
      /* noop */
    }

    // Возвращаем весь ответ axios (чтобы caller мог получить data и т.п.)
    return res;
  }

  /**
   * Логаут
   * @method GET
   * Только авторизованный пользователь может отправить.
   * Очищаем локальное хранилище токенов.
   */
  async logout() {
    const { mutate: mutateCache } = useSWRConfig();
    const { mutate: mutateMe } = useMe();
    const nav = useNavigate();
    return httpAuth.get(ENDPOINT.auth.logout).then((res) => {
      try {
        removeFromStorage();
        mutateMe();
        mutateCache(() => true, undefined, { revalidate: false });
        nav("/");
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
