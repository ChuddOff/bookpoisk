// src/shared/api/axios.ts
import axios, { type CreateAxiosDefaults } from "axios";
import {
  getAccessToken,
  setAccessToken,
  removeFromStorage,
} from "../auth/session"; // <-- путь как у тебя
import { authService } from "@/entities/auth/api/swr/auth.service"; // предполагается, что authService.refresh() реализован

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const option: CreateAxiosDefaults = {
  baseURL: BASE_URL,
  withCredentials: true,
};

/**
 * Инстанс запросов без авторизации
 */
export const http = axios.create(option);

/**
 * Инстанс запросов с авторизацией
 */
export const httpAuth = axios.create(option);

/**
 * добавление в заголовок токен
 */
httpAuth.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (!!token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

/**
 * Обработать запрос 'Unauthorized'
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * response interceptor
 */
httpAuth.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error?.config as any; // cast to any to allow _isRetry
    const status = error?.response?.status;

    // если получили 401/403 и это не повторный запрос
    if (
      (status === 401 || status === 403) &&
      originalRequest &&
      !originalRequest._isRetry
    ) {
      originalRequest._isRetry = true;

      if (isRefreshing) {
        // если уже идёт обновление — подождать нового токена
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            resolve(httpAuth.request(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // вызываем сервис refresh, он должен вернуть новый access в response.data
        const response = await authService.refresh();
        const newAccessToken =
          response?.data?.accessToken ?? response?.data?.access;

        if (newAccessToken) {
          // обновим локальное хранилище и дефолтный заголовок
          setAccessToken(newAccessToken);
          httpAuth.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;
          onTokenRefreshed(newAccessToken);
          return httpAuth.request(originalRequest);
        }

        removeFromStorage();
      } catch (refreshError) {
        removeFromStorage();
        console.error("Refresh token failed", refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);
