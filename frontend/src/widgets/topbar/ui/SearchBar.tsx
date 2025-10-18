import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button, Input, cn } from "@/shared/ui";
import { useDebouncedValue } from "@/shared/lib/hooks/useDebouncedValue";
import { useBooks, BookRowCard, BookRowCardSkeleton } from "@/entities/book";

/** Выпадашка результатов под инпутом (отрезаем до 4) */
function DesktopResults({
  query,
  onMore,
  className,
}: {
  query: string;
  onMore: () => void;
  className?: string;
}) {
  const { data, isLoading } = useBooks(
    { search: query, page: 1, per_page: 10 },
    { keepPreviousData: true }
  );
  const items = (data?.data ?? []).slice(0, 4);

  return (
    <div
      className={cn(
        "absolute left-0 top-full z-50 mt-2 w-full rounded-lg border border-line bg-white p-3 shadow-xl",
        className
      )}
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <BookRowCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="space-y-2">
            {items.map((b) => (
              <BookRowCard key={b.id} book={b} />
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={onMore}>
              Ещё
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-soft p-2 text-sm text-slate-600">
          Ничего не найдено.
        </div>
      )}
    </div>
  );
}

export function SearchBar({ className }: { className?: string }) {
  const nav = useNavigate();
  const [q, setQ] = React.useState("");
  const debounced = useDebouncedValue(q, 450);

  // фактический запрос, который уходит в хук
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // клик вне — закрыть
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // обычный поток по дебаунсу (≥ 2 символов)
  React.useEffect(() => {
    const s = debounced.trim();
    if (s.length >= 2) {
      setQuery(s);
      setOpen(true);
    } else if (!s) {
      setOpen(false);
      setQuery("");
    }
  }, [debounced]);

  // мгновенный поиск — открыть список даже если он закрыт
  const instantOpen = React.useCallback(() => {
    const s = q.trim();
    if (!s) return;
    setQuery(s);
    setOpen(true); // ⬅️ именно открыть (поиск-кнопка/Enter)
  }, [q]);

  const goCatalog = (s: string) => {
    setOpen(false); // ⬅️ расширенный закрывает подсказку
    nav(`/catalog?search=${encodeURIComponent(s.trim())}`);
  };

  return (
    <div ref={ref} className={cn("relative w-full max-w-[560px]", className)}>
      <div className="relative">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Найти книгу, автора, тег…"
          className="w-full pr-20"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              instantOpen(); // ⬅️ Enter открывает список (даже был закрыт)
            }
          }}
        />

        {/* лупа — открыть список результатов (мгновенно) */}
        <button
          type="button"
          aria-label="Найти"
          className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-soft"
          onClick={instantOpen}
        >
          <Search className="h-4 w-4" />
        </button>

        {/* шестерёнка — перейти в каталог и закрыть список */}
        <button
          type="button"
          aria-label="Расширенный поиск"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-soft"
          onClick={() => goCatalog(q)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {open && query && (
        <DesktopResults
          query={query}
          onMore={() => {
            goCatalog(query);
          }}
        />
      )}
    </div>
  );
}
