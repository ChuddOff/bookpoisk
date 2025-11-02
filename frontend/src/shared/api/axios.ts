// src/shared/api/axios.ts
import axios, { type CreateAxiosDefaults } from "axios";
import {
  getAccessToken,
  removeFromStorage,
  saveTokenStorage,
} from "../auth/session";
import { authService } from "./http.service";

const BASE_URL = import.meta.env.VITE_API_URL || "";

const option: CreateAxiosDefaults = {
  baseURL: BASE_URL,
  withCredentials: true,
};

/**
 * Инстанс запросов без авторизации (но у нас на все запросы будет подставляться Bearer ...)
 */
export const http = axios.create(option);

/**
 * Инстанс запросов с авторизацией
 */
export const httpAuth = axios.create(option);

/**
 * Установим Authorization: Bearer <token?> на ВСЕ исходящие запросы.
 * Если токена нет — заголовок будет "Bearer " (пробел и пустота), как вы просили.
 */
function attachBearerInterceptor(instance: typeof http | typeof httpAuth) {
  instance.interceptors.request.use(
    (config) => {
      try {
        const token = getAccessToken();
        config.headers = config.headers ?? {};
        // всегда ставим Bearer, даже если token пустой
        config.headers["Authorization"] = `Bearer ${token ?? ""}`;
      } catch (e) {
        // на случай, если getAccessToken бросит — всё равно отправляем пустой Bearer
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer `;
      }
      return config;
    },
    (err) => Promise.reject(err)
  );
}

// прикрепляем к обоим инстансам, если нужно на все запросы
attachBearerInterceptor(http);
attachBearerInterceptor(httpAuth);

/**
 * Обработать запрос 'Unauthorized' на httpAuth
 * (логика: при 401/403 попытаться refresh, поставить новый Bearer, затем повторить запрос.
 *  очередь ожидания, чтобы не дергать refresh несколько раз одновременно)
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

httpAuth.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = (error?.config ?? {}) as any; // any чтобы можно было писать _isRetry
    const status = error?.response?.status;

    if (
      (status === 401 || status === 403) &&
      originalRequest &&
      !originalRequest._isRetry
    ) {
      originalRequest._isRetry = true;

      if (isRefreshing) {
        // если уже идёт refresh, подписываемся и ждём
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            try {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              resolve(httpAuth.request(originalRequest));
            } catch (e) {
              reject(e);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        // вызов refresh'а (http POST /auth/refresh). authService.refresh() должен вернуть новый токен в response.data.accessToken|access
        const response = await authService.refresh();
        const newAccessToken = response?.data?.accessToken ?? null;

        if (newAccessToken) {
          // обновим in-memory / локальное хранилище если у вас есть функция
          try {
            if (typeof saveTokenStorage === "function") {
              saveTokenStorage(newAccessToken);
            }
          } catch {
            // noop
          }

          // Обновим дефолтный заголовок axios-инстанса
          httpAuth.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;
          // Также обновим заголовок у оригинального запроса
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // оповестим подписчиков и повторим запрос
          onTokenRefreshed(newAccessToken);
          return httpAuth.request(originalRequest);
        } else {
          // если бек не выдал новый токен — очистим хранилище
          removeFromStorage();
        }
      } catch (refreshError) {
        // refresh не удался — очистим хранилище и логируем
        try {
          removeFromStorage();
        } catch {
          /* noop */
        }
        console.error("Refresh token failed", refreshError);
        // можно тут редиректить на login
      } finally {
        isRefreshing = false;
      }
    }

    // пробрасываем ошибку дальше
    return Promise.reject(error);
  }
);
