// src/pages/home/ui/HomePage.tsx
import * as React from "react";
import { Container } from "@/shared/ui";
import { SectionFeed } from "@/widgets/categories";
import { useBookGenres } from "@/entities/book";

// утилита: перемешать и взять n элементов
function pickRandom<T>(arr: T[], n: number): T[] {
  // на всякий: уберём дубли и создадим копию
  const a = Array.from(new Set(arr));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export function HomePage() {
  const { data: genres, isLoading, error } = useBookGenres();

  // выбираем случайные жанры только когда данные пришли/обновились
  const selected = React.useMemo(() => {
    if (!genres || genres.length === 0) return [];
    return pickRandom(genres, Math.min(3, genres.length));
  }, [genres]);

  return (
    <Container>
      <div className="space-y-10">
        {/* загрузка: три секции-скелетона */}
        {isLoading && (
          <>
            <SectionFeed title="Загрузка…" params={{}} />
            <SectionFeed title="Загрузка…" params={{}} />
            <SectionFeed title="Загрузка…" params={{}} />
          </>
        )}

        {/* ошибка: безопасные фолбэки без фильтра по жанрам */}
        {!isLoading && error && (
          <>
            <SectionFeed title="Популярное" params={{}} />
            <SectionFeed title="Новинки" params={{}} />
            <SectionFeed title="Выбор редакции" params={{}} />
          </>
        )}

        {/* успех: три случайных жанра */}
        {!isLoading &&
          !error &&
          selected.map((g) => (
            <SectionFeed key={g} title={g} params={{ genres: [g] }} />
          ))}
      </div>
    </Container>
  );
}
