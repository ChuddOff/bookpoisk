// src/pages/auth/ui/AuthDonePage.tsx
import { authService } from "@/shared";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mutate } from "swr";

export function AuthDonePage() {
  const nav = useNavigate();

  useEffect(() => {
    async function handle() {
      // 1) Попробуем найти token в query: ?access=... или ?token=...
      const searchParams = new URLSearchParams(window.location.search);
      let token =
        searchParams.get("access") ?? searchParams.get("token") ?? null;

      // 2) Если не в search, попробуем в hash (#access=...)
      if (!token && window.location.hash) {
        const hash = window.location.hash.replace(/^#/, "");
        const hs = new URLSearchParams(hash);
        token = hs.get("access") ?? hs.get("token") ?? null;
      }

      if (!token) {
        // ничего не нашли — можно показать ошибку или просто редиректнуть
        nav("/");
        return;
      }

      try {
        console.log(token);

        // 3) Передаём токен в сервис (сохранит cookie и поставит header)
        const { profile } = await authService.acceptOAuth(token);

        // 4) убираем токен из url чтобы не светился
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // 5) если у тебя есть useMe (SWR key 'me'), обновить его:
        try {
          // fetch profile into SWR cache (если profile есть)
          if (profile) {
            mutate(["me"], profile, false); // replace cache with profile
          } else {
            // убедиться что useMe сможет перезагрузиться и получить данные
            mutate(["me"]);
          }
        } catch (e) {
          // noop
        }

        // 6) окончательный переход куда нужно
        nav("/"); // или /profile
      } catch (e) {
        console.error("acceptOAuth failed", e);
        nav("/"); // fallback
      }
    }

    handle();
  }, [nav]);

  return (
    <div className="p-6">
      <h3>Авторизация...</h3>
      <p>Подождите — мы завершаем вход.</p>
    </div>
  );
}
