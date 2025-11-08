import * as React from "react";
import type { BookEntity } from "@/entities/book";
import { LikeButton } from "@/features/favorites";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

type Props = { book: BookEntity; onLiked?: (id: string) => void };

export function BookCard({ book }: Props) {
  const go = React.useCallback(() => {
    window.location.href = `/book/${book.id}`;
  }, [book.id]);

  const onKeyNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  };

  console.log(book.genres);

  return (
    <Card
      role="link"
      tabIndex={0}
      className="mx-auto flex h-full w-full snap-start cursor-pointer flex-col"
      onClick={go}
      onKeyDown={onKeyNav}
    >
      <div className="flex select-none flex-col">
        <div className="p-3">
          <CoverBox src={book.cover} alt={book.title} />
        </div>

        <CardHeader className="px-3 pb-3 pt-0">
          <CardTitle className="line-clamp-2 text-sm leading-tight">
            {book.title}
          </CardTitle>
          <div className="mb-0 mt-1 line-clamp-2 text-xs text-slate-500">
            {book.author}
          </div>
          <div className="text-xs text-slate-500">{book.year}</div>
        </CardHeader>
      </div>

      <CardContent className="mt-auto select-none px-3 pb-3 pt-0">
        <div className="mt-auto flex flex-col items-start gap-6">
          {book.genres ? (
            <div className="flex flex-col gap-2">
              {book.genres.map((genre, i) => (
                <Badge
                  variant="secondary"
                  className="line-clamp-1 w-fit text-[11px]"
                  key={i}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}

          {/* Кнопка лайка не пробивает клики наружу — см. обработчики внутри LikeButton */}
          <LikeButton id={book.id} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function CoverBox({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border border-line bg-soft">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackDataUri;
          }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-xs text-slate-500">
          Нет обложки
        </div>
      )}
    </div>
  );
}

// простая заглушка-картинка 3×4, чтобы не ломалась сетка
const fallbackDataUri =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="100%" height="100%" fill="#F6F7F9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#95A1AF" font-size="14">no cover</text></svg>`
  );

export function BookCardSkeleton() {
  return (
    <Card className="w-full snap-start">
      <div className="p-3">
        <div className="aspect-[3/4] w-full rounded-xl border border-line bg-soft" />
      </div>
      <CardHeader className="px-3 pb-3 pt-0">
        <div className="mb-2 h-4 w-4/5 rounded bg-soft" />
        <div className="h-3 w-2/3 rounded bg-soft" />
      </CardHeader>
    </Card>
  );
}
