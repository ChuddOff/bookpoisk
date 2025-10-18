import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogOverlay,
  Input,
  cn,
} from "@/shared/ui";

import { useDebouncedValue } from "@/shared/lib/hooks/useDebouncedValue";
import { useBooks, BookRowCard, BookRowCardSkeleton } from "@/entities/book";

function MobileResults({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: () => void;
}) {
  const { data, isLoading } = useBooks(
    { search: query, page: 1, per_page: 10 },
    { keepPreviousData: true }
  );

  const items = (data?.data ?? []).slice(0, 4);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <BookRowCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!items.length && query.trim().length >= 2) {
    return <div className="p-4 text-sm text-slate-600">Ничего не найдено.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((b) => (
        <BookRowCard key={b.id} book={b} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function MobileSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const nav = useNavigate();

  // текст и дебаунс
  const [q, setQ] = React.useState("");
  const debounced = useDebouncedValue(q, 450);

  // фактическая строка, по которой делаем запрос
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const s = debounced.trim();
    if (s.length >= 1) setQuery(s);
    if (!s) setQuery("");
  }, [debounced]);

  const instantSearch = React.useCallback(() => {
    const s = q.trim();
    if (!s) return;
    setQuery(s);
  }, [q]);

  const goCatalog = React.useCallback(() => {
    const s = q.trim();
    onOpenChange(false);
    if (!s) nav(`/catalog`);
    nav(`/catalog?search=${encodeURIComponent(s)}`);
  }, [q, nav, onOpenChange]);

  const closeAndNavigate = React.useCallback(() => {
    onOpenChange(false); // ⬅️ закрываем модалку при клике на карточку
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Оверлей на весь экран без анимаций */}
      <DialogOverlay className="fixed inset-0 z-[79] bg-black/30 !animate-none" />

      {/* Контент: фиксируем по вьюпорту, убираем translate и анимации */}
      <DialogContent
        hideClose // ⬅️ скрываем дефолтный крестик shadcn
        className={cn(
          "fixed left-0 top-0 z-[80] m-0 h-[100dvh] w-[100dvw] max-w-none",
          "translate-x-0 translate-y-0 rounded-none border-0 p-0",
          "!animate-none"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Верхняя панель */}
          <div className="flex items-center gap-2 border-b border-line p-3">
            {/* наш собственный крестик слева */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative flex-1">
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск книги, автора…"
                className="w-full pr-20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    instantSearch(); // мгновенно показать результаты
                  }
                }}
              />

              {/* Лупа — мгновенный поиск */}
              <button
                type="button"
                aria-label="Найти"
                className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-soft"
                onClick={instantSearch}
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Шестерёнка — в каталог */}
              <button
                type="button"
                aria-label="Расширенный поиск"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-soft"
                onClick={goCatalog}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Результаты */}
          <div className="flex-1 overflow-auto p-3">
            {query ? (
              <MobileResults query={query} onNavigate={closeAndNavigate} />
            ) : (
              <div className="p-4 text-sm text-slate-600 mx-auto text-center">
                Начните вводить название…
              </div>
            )}
          </div>

          {/* Кнопка «Ещё» */}
          <div className="border-t border-line p-3">
            <Button className="w-full" onClick={goCatalog} disabled={!q.trim()}>
              Ещё
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
