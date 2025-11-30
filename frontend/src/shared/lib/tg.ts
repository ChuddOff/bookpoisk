// src/shared/init/tg.ts
export function initTelegramLayout() {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    // Обязательно — сообщаем Telegram, что приложение готово
    try {
      tg.ready?.();
    } catch {}

    // Попробуй получить высоту хедера, если API её предоставляет
    // (разные версии могут иметь разную нотацию, поэтому проверяем несколько вариантов)
    const headerHeight =
      (typeof tg.headerHeight === "number" && tg.headerHeight) ||
      (tg.viewport?.top ?? 0) || // некоторые сборки могут иметь viewport/top
      56; // fallback, если не нашли

    // выставим CSS-класс и переменную (используем root переменную)
    document.documentElement.classList.add("tma");
    document.documentElement.style.setProperty(
      "--tma-header-height",
      `${Math.ceil(headerHeight)}px`
    );

    console.log("[TGA] Telegram WebApp detected, headerHeight=", headerHeight);
  } catch (e) {}
}
