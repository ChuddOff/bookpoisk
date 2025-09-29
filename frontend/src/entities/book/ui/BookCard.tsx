import * as React from "react";
import type { Book } from "@/entities/book/model/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Heart } from "lucide-react";
import { useLikeBook } from "@/entities/book/api";
import { toast } from "@/shared/ui/sonner";

type Props = { book: Book; onLiked?: (id: string) => void };

export function BookCard({ book, onLiked }: Props) {
  const { trigger, isMutating } = useLikeBook();
  const [liked, setLiked] = React.useState(false);

  const handleLike = async () => {
    try {
      await trigger(book.id); // POST /likeBook?id=...
      setLiked(true);
      onLiked?.(book.id);
      toast.success("Добавлено в избранное", { description: book.title });
    } catch (e: any) {
      toast.error("Не удалось добавить", { description: e?.message });
    }
  };

  return (
    <Card className="snap-start w-[180px] rounded-xl h-full flex flex-col items-between mx-auto">
      <div className="flex flex-col">
        <div className="p-3">
          <CoverBox src={book.cover} alt={book.title} />
        </div>

        <CardHeader className="pt-0">
          <CardTitle className="text-sm leading-tight line-clamp-2">
            {book.title}
          </CardTitle>
          <div className="mt-1 text-xs text-slate-500 line-clamp-1">
            {book.author}
            {book.year ? `, ${book.year}` : ""}
          </div>
        </CardHeader>
      </div>

      <CardContent className="mt-auto">
        <div className="flex flex-col gap-2 mt-auto">
          {book.genre ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px]">
                {book.genre}
              </Badge>
            </div>
          ) : null}
          <Button
            size="sm"
            variant={liked ? "default" : "outline"}
            onClick={handleLike}
            disabled={isMutating || liked}
            className="h-8 px-3 w-full"
            title="В избранное"
          >
            <Heart className="h-4 w-4 mr-1" />
            {liked ? "В избранном" : "Лайк"}
          </Button>
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
    <Card className="snap-start w-[180px] rounded-xl">
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
