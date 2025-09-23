// src/shared/config/env.ts
export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  // сюда же можно добавить VITE_APP_MODE и т.п.
} as const;
