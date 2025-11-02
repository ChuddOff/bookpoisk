// src/shared/api/axios.ts
import axios from "axios";
import type { AxiosError, AxiosInstance, CreateAxiosDefaults } from "axios";
import {
  getAccessToken,
  saveTokenStorage,
  removeFromStorage,
} from "../auth/session";
import { authService } from "./http.service";

// === Базовый URL бекенда ===
// пример: https://bookpoisk-idwp.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL as string;

// === ЕДИНСТВЕННЫЙ экспортируемый инстанс (используется всем приложением) ===
const config: CreateAxiosDefaults = {
  baseURL: BASE_URL,
  withCredentials: false, // Bearer-only → убирает требование Access-Control-Allow-Credentials
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};
export const httpAuth: AxiosInstance = axios.create(config);

// === Внутренний "голый" клиент без интерсепторов — только для /auth/refresh, чтобы не зациклиться ===
export const http: AxiosInstance = axios.create(config);

// Если токен уже есть в хранилище — подставим его в дефолтные заголовки
const initialAccess =
  typeof getAccessToken === "function" ? getAccessToken() : null;
if (initialAccess) {
  httpAuth.defaults.headers.common["Authorization"] = `Bearer ${initialAccess}`;
  http.defaults.headers.common["Authorization"] = `Bearer ${initialAccess}`;
}

// ===== Кооперативная обработка одновременных 401 =====
let isRefreshing = false;
let subscribers: Array<(t: string) => void> = [];

function subscribeTokenRefresh(cb: (t: string) => void) {
  subscribers.push(cb);
}
function onTokenRefreshed(newAccess: string) {
  subscribers.forEach((cb) => cb(newAccess));
  subscribers = [];
}

// Унифицированный вызов refresh’а через authService, без рекурсии интерсепторов
async function doRefresh(): Promise<string> {
  // Пытаемся вызвать authService.refresh; он может принимать клиент или нет — поддержим оба варианта
  // @ts-ignore — допускаем перегрузку у authService.refresh
  const resp = await (authService.refresh?.length
    ? authService.refresh()
    : authService.refresh());
  const data = resp?.data ?? {};

  const access: string | undefined = data.accessToken;
  const refresh: string | undefined = data.accessToken;

  if (!access) {
    throw new Error("REFRESH_RESPONSE_INVALID");
  }

  // Обновим хранилище (если ваша функция принимает только access — extra аргумент будет проигнорирован)
  try {
    if (typeof saveTokenStorage === "function") {
      // @ts-ignore — поддержим сигнатуры saveTokenStorage(access) и saveTokenStorage(access, refresh)
      saveTokenStorage(access, refresh);
    }
  } catch {
    /* noop */
  }

  // Обновим дефолтный заголовок на основном инстансе
  httpAuth.defaults.headers.common["Authorization"] = `Bearer ${access}`;

  http.defaults.headers.common["Authorization"] = `Bearer ${access}`;

  return access;
}

// === Request: во все запросы автоматически подставляем Bearer из хранилища ===
httpAuth.interceptors.request.use((cfg) => {
  const access = typeof getAccessToken === "function" ? getAccessToken() : null;
  if (access) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["Authorization"] = `Bearer ${access}`;
  }
  return cfg;
});

http.interceptors.request.use((cfg) => {
  const access = typeof getAccessToken === "function" ? getAccessToken() : null;
  if (access) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["Authorization"] = `Bearer ${access}`;
  }
  return cfg;
});

// === Response: перехват 401 и кооперативный refresh с единичным ретраем исходного запроса ===
httpAuth.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const errCode = (error.response?.data as any)?.error;
    const original = error.config as any;

    // Защита от зацикливания: ретраим только один раз
    if (!original || original._retry) {
      return Promise.reject(error);
    }

    const shouldRefresh =
      status === 401 &&
      (errCode === "ACCESS_EXPIRED" ||
        errCode === "UNAUTHORIZED" || // запасной сценарий
        errCode === "ACCESS_INVALID");

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Уже идёт refresh → ждём нового access, после чего повторим запрос
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newAccess) => {
          try {
            original._retry = true;
            original.headers = original.headers ?? {};
            original.headers["Authorization"] = `Bearer ${newAccess}`;
            resolve(httpAuth.request(original));
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    // Стартуем refresh сами
    isRefreshing = true;
    try {
      const newAccess = await doRefresh();
      original._retry = true;
      original.headers = original.headers ?? {};
      original.headers["Authorization"] = `Bearer ${newAccess}`;
      onTokenRefreshed(newAccess);
      return httpAuth.request(original);
    } catch (e) {
      // Refresh не удался → чистим хранилище и пробрасываем ошибку
      try {
        if (typeof removeFromStorage === "function") removeFromStorage();
      } catch {
        /* noop */
      }
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const errCode = (error.response?.data as any)?.error;
    const original = error.config as any;

    // Защита от зацикливания: ретраим только один раз
    if (!original || original._retry) {
      return Promise.reject(error);
    }

    const shouldRefresh =
      status === 401 &&
      (errCode === "ACCESS_EXPIRED" ||
        errCode === "UNAUTHORIZED" || // запасной сценарий
        errCode === "ACCESS_INVALID");

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Уже идёт refresh → ждём нового access, после чего повторим запрос
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newAccess) => {
          try {
            original._retry = true;
            original.headers = original.headers ?? {};
            original.headers["Authorization"] = `Bearer ${newAccess}`;
            resolve(httpAuth.request(original));
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    // Стартуем refresh сами
    isRefreshing = true;
    try {
      const newAccess = await doRefresh();
      original._retry = true;
      original.headers = original.headers ?? {};
      original.headers["Authorization"] = `Bearer ${newAccess}`;
      onTokenRefreshed(newAccess);
      return httpAuth.request(original);
    } catch (e) {
      // Refresh не удался → чистим хранилище и пробрасываем ошибку
      try {
        if (typeof removeFromStorage === "function") removeFromStorage();
      } catch {
        /* noop */
      }
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
