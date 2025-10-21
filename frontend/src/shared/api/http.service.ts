// src/shared/api/http.service.ts
import { env } from "@/shared/config";
import { toQueryString, type Query } from "@/shared/lib";
import { session } from "@/shared/auth/session";

// Явная константа для refresh-эндпоинта
const REFRESH_PATH = "/auth/refresh";

export class HttpError extends Error {
  status: number;
  payload?: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class ApiService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async tryRefreshAccess(): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl + REFRESH_PATH, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      const access = (data as any)?.access as string | undefined;
      if (!access) return false;
      session.set(access);
      return true;
    } catch {
      return false;
    }
  }

  private async requestOnce(
    path: string,
    options: {
      method?: HttpMethod;
      query?: Query;
      body?: unknown;
      headers?: Record<string, string>;
    } = {}
  ): Promise<Response> {
    const { method = "GET", query, body, headers } = options;
    const url = this.baseUrl + path + toQueryString(query);

    const h: Record<string, string> = {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    };

    const access = session.get();
    if (access) h.Authorization = `Bearer ${access}`;

    return fetch(url, {
      method,
      headers: h,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async request<T>(
    path: string,
    options: {
      method?: HttpMethod;
      query?: Query;
      body?: unknown;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    let res = await this.requestOnce(path, options);

    if (res.status === 401) {
      const refreshed = await this.tryRefreshAccess();
      if (refreshed) {
        res = await this.requestOnce(path, options);
      }
    }

    const text = await res.text();
    let data: unknown = undefined;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      /* noop */
    }

    if (!res.ok) {
      const message =
        (data as any)?.message ?? res.statusText ?? "Request failed";
      if (res.status === 401) session.clear();
      throw new HttpError(res.status, message, data);
    }
    return data as T;
  }

  get<T>(path: string, query?: Query) {
    return this.request<T>(path, { method: "GET", query });
  }
  post<T>(path: string, body?: unknown, query?: Query) {
    return this.request<T>(path, { method: "POST", body, query });
  }
  put<T>(path: string, body?: unknown, query?: Query) {
    return this.request<T>(path, { method: "PUT", body, query });
  }
  patch<T>(path: string, body?: unknown, query?: Query) {
    return this.request<T>(path, { method: "PATCH", body, query });
  }
  del<T>(path: string, query?: Query) {
    return this.request<T>(path, { method: "DELETE", query });
  }
}

export const apiService = new ApiService(env.API_URL);
