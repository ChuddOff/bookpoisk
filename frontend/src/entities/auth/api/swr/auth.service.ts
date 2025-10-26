// src/features/auth/auth.service.ts
import { http } from "@/shared/api/axios"; // экземпляр без авторизации
import { setAccessToken, clearAccessToken } from "@/shared/auth/session";

export const authService = {
  // вызывает бек для обновления access (refresh cookie передаётся автоматически через withCredentials)
  async refresh() {
    // ожидаем { accessToken: string } или { access: string } — подкорректируйте под бек
    return http.post("/auth/refresh");
  },

  async logout() {
    try {
      await http.post("/auth/logout");
    } finally {
      clearAccessToken();
    }
  },

  // Вспомогательное: принять ответ и установить access
  acceptNewAccess(response: any) {
    const newAccessToken =
      response?.data?.accessToken ?? response?.data?.access;

    if (newAccessToken) {
      setAccessToken(newAccessToken);
      return newAccessToken;
    }
    return null;
  },
};
