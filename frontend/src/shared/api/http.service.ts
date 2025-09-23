// src/shared/api/http.service.ts
import { env } from "@/shared/config/env";
import { toQueryString, type Query } from "@/shared/lib/query";

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
  // ⬇️ объявляем поле отдельно (это стирается на этапе типов)
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    // ⬇️ явное присваивание вместо параметр-свойства
    this.baseUrl = baseUrl;
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
    const { method = "GET", query, body, headers } = options;
    const url = this.baseUrl + path + toQueryString(query);

    const res = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

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

// единый инстанс
export const apiService = new ApiService(env.API_URL);
