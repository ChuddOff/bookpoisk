import * as React from "react";
import { useLikeBook, useLikedBooksMe } from "@/entities/book";
import { Button, cn } from "@/shared/ui";
import { Heart, HeartOff, Loader2 } from "lucide-react";
import { useRequireAuth } from "@/app/providers/AuthGateProvider";
import { useUnlikeBook } from "@/entities/book/api/swr/useUnlikeBook";
import type { SWRConfiguration } from "swr";

type Props = {
  id: string;
  className?: string;
};

export function LikeButton({ id, className }: Props) {
  const requireAuth = useRequireAuth();
  const like = useLikeBook();
  const unlike = useUnlikeBook();

  const {
    data: booksResp,
    isLoading: booksLoading,
    mutate: mutateLikedBooks,
  } = useLikedBooksMe({
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  } as SWRConfiguration);

  const [pending, setPending] = React.useState(false);
  const [likedLocal, setLikedLocal] = React.useState<boolean>(false);

  // синхронизация локального состояния с ответом SWR
  React.useEffect(() => {
    const isLiked = !!booksResp?.data?.some((b) => b.id === id);
    setLikedLocal(isLiked);
  }, [booksResp, id]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (pending) return;

    const ok = requireAuth({ type: "like-book", bookId: id });
    if (!ok) return;

    const wasLiked = likedLocal; // сохраним предыдущее значение для отката
    // оптимистично меняем UI
    setLikedLocal(!wasLiked);
    setPending(true);

    try {
      if (wasLiked) {
        await unlike(id);
      } else {
        await like(id);
      }

      // обновляем кэш/ревалидируем — mutate() без аргументов перезапросит сервер
      await mutateLikedBooks();
      // НЕ делать setLikedLocal(true) тут — mutate/реакция useEffect приведёт к корректному состоянию
    } catch (err) {
      // откатим локальное состояние при ошибке
      setLikedLocal(wasLiked);
      console.error("Ошибка при (un)like:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant={likedLocal ? "default" : "outline"}
      size="default"
      disabled={pending || booksLoading}
      onClick={handleClick}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      aria-pressed={!!likedLocal}
      className={cn("gap-2", className)}
    >
      {pending || booksLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : likedLocal ? (
        <HeartOff className="h-4 w-4" />
      ) : (
        <Heart className="h-4 w-4" />
      )}
      {likedLocal ? "Убрать из избранного" : "В избранное"}
    </Button>
  );
}
