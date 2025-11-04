import { useNavigate } from "react-router-dom";

import { useLikedBooksMe, type BookEntity } from "@/entities/book";
import { cn } from "@/shared/ui";
import { X } from "lucide-react";
import type { SWRConfiguration } from "swr";
import { useUnlikeBook } from "../api/swr/useUnlikeBook";

type Props = {
  book: BookEntity;
  onNavigate?: () => void;
  showX?: boolean;
  className?: string;
};

export function BookRowCard({ book, showX, className }: Props) {
  const { mutate: mutateLikedBooks } = useLikedBooksMe({
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  } as SWRConfiguration);

  const unlike = useUnlikeBook();

  const nav = useNavigate();

  const cover = book.cover || book.photos?.[0];
  const onNavigate = () => {
    nav(`/book/${book.id}`);
    window.scrollTo(0, 0);
  };
  return (
    <div
      onClick={onNavigate}
      className={cn(
        "group flex gap-3 rounded-lg border border-line bg-white p-2 transition-colors hover:bg-soft relative",
        className
      )}
    >
      <div className="h-30 w-24 max-sm:w-32 max-sm:h-40 shrink-0 overflow-hidden rounded-lg bg-soft">
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-between">
        <div className="min-w-0 flex-1 flex flex-col">
          {/* было truncate — убираем, разрешаем переносы */}
          <div className="line-clamp-2 break-words text-sm font-medium text-ink">
            {book.title}
          </div>

          <div className="mt-0.5 whitespace-normal break-words text-xs text-slate-600">
            {book.author}
            {book.year ? ` • ${book.year}` : ""}
            {book.pages ? ` • ${book.pages} стр.` : ""}
          </div>
        </div>

        {book.genre && (
          <div className=" lex flex-wrap gap-1">
            {book.genre.map((g) => (
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

      {showX && (
        <X
          size={20}
          className="absolute right-2 top-2 text-brand cursor-pointer"
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();

            await unlike(book.id);
            mutateLikedBooks();
          }}
        />
      )}
    </div>
  );
}

export function BookRowCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-white p-2">
      <div className="h-30 w-24 rounded-lg bg-soft animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-soft animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-soft animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-soft animate-pulse" />
      </div>
    </div>
  );
}
