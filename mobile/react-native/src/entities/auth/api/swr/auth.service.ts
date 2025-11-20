// src/features/auth/auth.service.ts
import { http } from "@/shared/api/axios"; // экземпляр без авторизации
import { removeFromStorage, saveTokenStorage } from "@/shared/auth/session";
import { ENDPOINT } from "@/shared/api";

export const authService = {
  // вызывает бек для обновления access (refresh cookie передаётся автоматически через withCredentials)
  async refresh() {
    // ожидаем { accessToken: string } или { access: string } — подкорректируйте под бек
    return http.post(ENDPOINT.auth.refresh);
  },

  async logout() {
    try {
      await http.post(ENDPOINT.auth.logout);
    } finally {
      removeFromStorage();
    }
  },

  // Вспомогательное: принять ответ и установить access
  acceptNewAccess(response: any) {
    const newAccessToken =
      response?.data?.accessToken ?? response?.data?.access;

    if (newAccessToken) {
      saveTokenStorage(newAccessToken);
      return newAccessToken;
    }
    return null;
  },
};
