// src/features/auth/hooks/useLogout.ts
import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { useNavigate } from "react-router-dom";
import { removeFromStorage } from "@/shared/auth/session";
import { authService } from "@/shared";

export function useLogout() {
  const { mutate } = useSWRConfig();
  const nav = useNavigate();

  return useCallback(async () => {
    try {
      // 1) Попытка logout на сервере (если нужно)
      await authService.logout();
    } catch (err) {
      console.warn("authService.logout failed:", err);
      // Не прерываем: даже если бек упал, продолжаем чистку на клиенте
    }

    // 2) Клиентская очистка хранилища (access/refresh)
    try {
      removeFromStorage(); // у тебя уже есть console.log(1212) внутри — проверишь, что срабатывает
    } catch (e) {
      console.warn("removeFromStorage failed", e);
    }

    // 4) Сброс SWR: ключ "me" и (опционально) весь кэш
    try {
      // явно сбрасываем профиль
      await mutate(["me"], undefined, { revalidate: false });
    } catch (e) {
      console.warn("mutate me failed", e);
    }

    try {
      // грубый способ очистить всё кеш: mutate(pred, undefined, { revalidate:false })
      await mutate(() => true, undefined, { revalidate: false });
    } catch (e) {
      // некоторые версии SWR не поддержуют mutate(pred) — игнорируем ошибку
    }

    // 5) Навигация
    nav("/");
  }, [mutate, nav]);
}
