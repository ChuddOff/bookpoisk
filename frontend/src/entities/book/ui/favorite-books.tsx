import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

import {
  BookRowCard,
  BookRowCardSkeleton,
} from "@/entities/book/ui/BookRowCard";
import { useLikedBooksMe } from "@/entities/book";

export function FavoriteBooks({
  onClick,
  generating,
}: {
  onClick: () => void;
  generating: boolean;
}) {
  const { data, isLoading, error } = useLikedBooksMe();

  const items = data?.data ?? [];

  return (
    <>
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookRowCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-line bg-white p-4 text-sm text-slate-700">
          Ошибка при загрузке избранного. Попробуйте ещё раз.
        </div>
      )}

      {!isLoading && !error && items?.length === 0 && (
        <div className="rounded-xl border border-line bg-white p-6 text-center text-slate-700">
          В избранном пока пусто.
        </div>
      )}

      {!isLoading && !error && items?.length > 0 && (
        // grid: 1 column on xs, 2 on sm, 3 on lg
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => (
            // Оборачиваем BookRowCard в блок, чтобы карточка растягивалась по ширине колонки
            <div key={b.id} className="w-full">
              <BookRowCard book={b} showX />
            </div>
          ))}
        </div>
      )}

      {/* Footer area — кнопка генерации */}
      <div className="mt-6 flex justify-center">
        <Button
          variant="outline"
          onClick={onClick}
          disabled={generating}
          className="flex items-center gap-3"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Сгенерировать рекомендации
        </Button>
      </div>
    </>
  );
}
