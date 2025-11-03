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

  const { data: booksResp, isLoading: booksLoading } = useLikedBooksMe({
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  } as SWRConfiguration);

  const [pending, setPending] = React.useState(false);
  const [likedLocal, setLikedLocal] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (booksResp?.data && booksResp.data.map((b) => b.id).includes(id)) {
      setLikedLocal(true);
    }
  }, [booksResp]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // важно: останавливаем событие, чтобы родительская карточка/редирект не сработали
    e.preventDefault();
    e.stopPropagation();

    if (pending) return;

    // если не авторизован — откроется модалка и действие выполнится после логина (через intent)
    const ok = requireAuth({ type: "like-book", bookId: id });
    if (!ok) return;

    try {
      setPending(true);
      likedLocal ? await unlike(id) : await like(id);
      setLikedLocal(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant={likedLocal ? "default" : "outline"}
      size="default"
      disabled={pending || !!likedLocal}
      onClick={handleClick}
      // ещё на фазе захвата/нажатия тушим событие — чтоб точно не «протекло»
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
      {pending && booksLoading ? (
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
