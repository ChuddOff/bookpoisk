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
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;
    try {
      tg.ready?.();
    } catch {}
    // если Telegram сообщает о смене темы — подхватим
    const handler = () => {
      const scheme = tg.colorScheme;
      if (scheme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    // подстраховка — некоторые версии имеют onEvent
    if (tg.onEvent) {
      try {
        tg.onEvent("themeChanged", handler);
      } catch {}
    }
    handler();
    return () => {
      if (tg.offEvent)
        try {
          tg.offEvent("themeChanged", handler);
        } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* TopBar всё ещё рендерим — но добавим контейнеру класс, чтобы применялось padding-top */}
      <div className="pt-3">
        <TopBar />
      </div>

      <main className="py-3">
        <Outlet />
      </main>
    </div>
  );
}
