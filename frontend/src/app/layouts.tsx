import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { TopBar } from "@/widgets";

/** Веб-лэйаут: общий фон + TopBar + <main> */
export function WebLayout() {
  return (
    <div className="min-h-screen w-full bg-soft">
      <TopBar />
      <main className="py-6 max-md:py-3">
        <Outlet />
      </main>
    </div>
  );
}

/** TMA-лэйаут: без TopBar, подтягиваем цветовую схему Telegram */
export function TmaLayout() {
  // Простая адаптация под тему Telegram: если colorScheme === 'dark', включаем .dark
  useEffect(() => {
    // @ts-expect-error Telegram WebApp может быть не объявлен в типах
    const tg = window?.Telegram?.WebApp;
    const scheme = tg?.colorScheme as "dark" | "light" | undefined;
    if (scheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // опционально: можно подписаться на изменения темы tg?.onEvent('themeChanged', ...)
    try {
      tg?.ready?.();
    } catch {}
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* В TMA нет TopBar — навигацию внутри делаем на экранах */}
      <main className="py-3">
        <Outlet />
      </main>
    </div>
  );
}
