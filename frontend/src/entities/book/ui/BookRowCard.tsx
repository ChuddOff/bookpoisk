import { Link } from "react-router-dom";
import type { Book } from "@/entities/book/model/types";
import { cn } from "@/shared/ui/cn";

type Props = {
  book: Book;
  onNavigate?: () => void;
  className?: string;
};

export function BookRowCard({ book, onNavigate, className }: Props) {
  const cover = book.cover || book.photos?.[0];
  return (
    <Link
      to={`/book/${book.id}`}
      onClick={onNavigate}
      className={cn(
        "group flex gap-3 rounded-lg border border-line bg-white p-2 hover:bg-soft transition-colors",
        className
      )}
    >
      <div className="h-30 w-24 shrink-0 overflow-hidden rounded-md bg-soft">
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        {/* было truncate — убираем, разрешаем переносы */}
        <div className="text-sm font-medium text-ink line-clamp-2 break-words">
          {book.title}
        </div>

        <div className="mt-0.5 text-xs text-slate-600 whitespace-normal break-words">
          {book.author}
          {book.year ? ` • ${book.year}` : ""}
          {book.pages ? ` • ${book.pages} стр.` : ""}
        </div>

        {book.genre && (
          <div className="mt-1 flex flex-wrap gap-1">
            {book.genre.split(", ").map((g) => (
              <span
                key={g}
                className="rounded-full border border-line bg-white px-2 py-0.5 text-[11px] text-slate-700"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function BookRowCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-white p-2">
      <div className="h-30 w-24 rounded-md bg-soft animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-soft animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-soft animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-soft animate-pulse" />
      </div>
    </div>
  );
}
