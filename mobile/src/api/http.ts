import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from "axios";
import Constants from "expo-constants";
import {
  getAccessToken as loadAccess,
  getRefreshToken as loadRefresh,
  saveTokens,
  clearTokens,
} from "@/storage/tokens";
import { ENDPOINT } from "./endpoints";

const BASE_URL =
  Constants?.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

const config: CreateAxiosDefaults = {
  baseURL: BASE_URL,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAuthTokens(tokens: {
  access?: string | null;
  refresh?: string | null;
}) {
  accessToken = tokens.access ?? accessToken;
  refreshToken = tokens.refresh ?? refreshToken;
}

export async function loadPersistedTokens() {
  accessToken = (await loadAccess()) ?? null;
  refreshToken = (await loadRefresh()) ?? null;
  return { accessToken, refreshToken };
}

const httpAuth: AxiosInstance = axios.create(config);
export const http = httpAuth;

httpAuth.interceptors.request.use((cfg) => {
  if (accessToken) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return cfg;
});

async function refreshAccess() {
  const refresh = refreshToken ?? (await loadRefresh());
  if (!refresh) throw new Error("NO_REFRESH_TOKEN");
  const client = axios.create({ ...config, withCredentials: false });
  const resp = await client.post(ENDPOINT.auth.refresh, undefined, {
    headers: { Authorization: `Bearer ${refresh}` },
  });
  const data: any = resp.data ?? {};
  const newAccess: string | null = data.access ?? data.accessToken ?? null;
  const newRefresh: string | null =
    data.refresh ?? data.refreshToken ?? refresh;
  if (!newAccess) throw new Error("REFRESH_FAILED");
  accessToken = newAccess;
  refreshToken = newRefresh;
  await saveTokens(newAccess, newRefresh);
  return newAccess;
}

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

function enqueue(cb: (token: string) => void) {
  queue.push(cb);
}

function flush(newToken: string) {
  queue.forEach((cb) => cb(newToken));
  queue = [];
}

httpAuth.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as any;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        enqueue((token) => {
          try {
            original._retry = true;
            original.headers = {
              ...(original.headers ?? {}),
              Authorization: `Bearer ${token}`,
            };
            resolve(httpAuth(original));
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const newAccess = await refreshAccess();
      flush(newAccess);
      original._retry = true;
      original.headers = {
        ...(original.headers ?? {}),
        Authorization: `Bearer ${newAccess}`,
      };
      return httpAuth(original);
    } catch (err) {
      await clearTokens();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getBaseUrl() {
  return BASE_URL;
}

export function setTokensFromAuth(
  access?: string | null,
  refresh?: string | null,
) {
  accessToken = access ?? null;
  refreshToken = refresh ?? null;
}
