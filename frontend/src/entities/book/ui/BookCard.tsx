import * as React from "react";
import type { Book } from "@/entities/book/model/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { LikeButton } from "@/features/favorites/ui/LikeButton";

type Props = { book: Book; onLiked?: (id: string) => void };

export function BookCard({ book }: Props) {
  const [liked, setLiked] = React.useState(false);

  return (
    <Card
      className="snap-start w-full rounded-xl h-full flex flex-col items-between mx-auto cursor-pointer"
      onClick={() => {
        window.location.href = `/book/${book.id}`;
      }}
    >
      <div className="flex flex-col select-none">
        <div className="p-3">
          <CoverBox src={book.cover} alt={book.title} />
        </div>

        <CardHeader className="pt-0">
          <CardTitle className="text-sm leading-tight line-clamp-2">
            {book.title}
          </CardTitle>
          <div className="mt-1 text-xs text-slate-500 line-clamp-2 mb-0">
            {book.author}
          </div>
          <div className="text-xs text-slate-500 line-clamp-1">{book.year}</div>
        </CardHeader>
      </div>

      <CardContent className="mt-auto  select-none">
        <div className="flex flex-col items-start gap-6 mt-auto">
          {book.genre ? (
            <div className="flex flex-col gap-2">
              {book.genre.split(", ").map((genre, i) => (
                <Badge
                  variant="secondary"
                  className="text-[11px] w-fit line-clamp-1"
                  key={i}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}
          <LikeButton id={book.id} liked={liked} onLikedChange={setLiked} />
        </div>
      </CardContent>
    </Card>
  );
}

function CoverBox({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-line bg-soft">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackDataUri;
          }}
        />
      ) : (
        <div className="h-full w-full grid place-items-center text-xs text-slate-500">
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

// оставим Skeleton для состояний загрузки:
export function BookCardSkeleton() {
  return (
    <Card className="snap-start w-full rounded-xl">
      <div className="p-3">
        <div className="aspect-[3/4] w-full rounded-lg bg-soft border border-line" />
      </div>
      <CardHeader className="pt-0">
        <div className="h-4 w-4/5 bg-soft rounded mb-2" />
        <div className="h-3 w-2/3 bg-soft rounded" />
      </CardHeader>
    </Card>
  );
}
