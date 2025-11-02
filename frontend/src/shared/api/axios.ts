// src/shared/api/axios.ts
import axios from "axios";
import type { AxiosError, AxiosInstance, CreateAxiosDefaults } from "axios";
import {
  getAccessToken,
  saveTokenStorage,
  removeFromStorage,
  // если есть getRefreshToken — можно импортировать, но не обязателен:
  // getRefreshToken,
} from "../auth/session";
import { authService } from "./http.service";

// === Базовый URL бекенда ===
const BASE_URL = import.meta.env.VITE_API_URL as string;

// === ЕДИНСТВЕННЫЙ инстанс для всего приложения ===
const config: CreateAxiosDefaults = {
  baseURL: BASE_URL,
  withCredentials: false, // Bearer-only → без требований к Access-Control-Allow-Credentials
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};
const httpAuth: AxiosInstance = axios.create(config);

// Алиас, чтобы старые импорты не падали
const http = httpAuth;

// Если токен уже есть — сразу положим его в дефолтные заголовки
const initialAccess =
  typeof getAccessToken === "function" ? getAccessToken() : null;
if (initialAccess) {
  httpAuth.defaults.headers.common["Authorization"] = `Bearer ${initialAccess}`;
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

// Унифицированный вызов /auth/refresh.
// Ожидаем от бэка { access, refresh } ИЛИ { accessToken, refreshToken }.
async function doRefresh(): Promise<string> {
  // authService.refresh сам должен добавить Bearer <refresh> (обычно из session)
  // Чтобы не зациклиться — даём "голый" axios:
  // @ts-ignore поддержка возможной сигнатуры refresh(client?: AxiosInstance)
  const resp = await (authService.refresh?.length
    ? authService.refresh()
    : authService.refresh());
  const data = resp?.data ?? {};

  const access: string | undefined = data.accessToken;
  const refresh: string | undefined = data.accessToken;

  if (!access) throw new Error("REFRESH_RESPONSE_INVALID");

  // Сохраняем новые токены (если функция принимает два аргумента — ок; если один — лишний игнорнётся)
  try {
    if (typeof saveTokenStorage === "function") {
      // @ts-ignore поддержать saveTokenStorage(access) и saveTokenStorage(access, refresh)
      saveTokenStorage(access, refresh);
    }
  } catch {
    /* noop */
  }

  // Обновляем дефолтный Authorization
  httpAuth.defaults.headers.common["Authorization"] = `Bearer ${access}`;
  return access;
}

// === Request: во все запросы подставляем Bearer из хранилища ===
httpAuth.interceptors.request.use((cfg) => {
  const access = typeof getAccessToken === "function" ? getAccessToken() : null;
  console.log(access);

  cfg.headers = cfg.headers ?? {};
  cfg.headers["Authorization"] = `Bearer ${access ?? ""}`;
  return cfg;
});

// === Response: перехватываем 401 и один раз обновляем access, затем ретраим ===
httpAuth.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const errCode = (error.response?.data as any)?.error;
    const original = error.config as any;

    // Защита от зацикливания
    if (!original || original._retry) {
      return Promise.reject(error);
    }

    const shouldRefresh =
      status === 401 &&
      (errCode === "ACCESS_EXPIRED" ||
        errCode === "UNAUTHORIZED" ||
        errCode === "ACCESS_INVALID");

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Уже идёт refresh — ждём результат
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

    // Запускаем refresh сами
    isRefreshing = true;
    try {
      const newAccess = await doRefresh();
      original._retry = true;
      original.headers = original.headers ?? {};
      original.headers["Authorization"] = `Bearer ${newAccess}`;
      onTokenRefreshed(newAccess);
      return httpAuth.request(original);
    } catch (e) {
      // Refresh не удался — чистим и пробрасываем
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

// Экспорт под обеим именами (совместимость)
export { httpAuth, http };
export default httpAuth;
