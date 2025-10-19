import * as React from "react";

import { useLikeBook } from "@/entities/book";
import { Button, cn } from "@/shared/ui";
import { Heart, Loader2 } from "lucide-react";
import { useRequireAuth } from "@/app/providers/AuthGateProvider";

type Props = {
  id: string;
  /** если хочешь подсвечивать «уже в избранном» — передай true; иначе кнопка просто добавляет */
  liked?: boolean;
  onLikedChange?: (v: boolean) => void;
  className?: string;
};

export function LikeButton({
  id,
  liked: likedProp,
  onLikedChange,
  className,
}: Props) {
  const requireAuth = useRequireAuth();
  const like = useLikeBook();

  const [pending, setPending] = React.useState(false);
  const [likedLocal, setLikedLocal] = React.useState<boolean | undefined>(
    undefined
  );

  const liked = likedProp ?? likedLocal;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // важно: останавливаем событие, чтобы родительская карточка/редирект не сработали
    e.preventDefault();
    e.stopPropagation();

    if (pending || liked) return;

    // если не авторизован — откроется модалка и действие выполнится после логина (через intent)
    const ok = requireAuth({ type: "like-book", bookId: id });
    if (!ok) return;

    try {
      setPending(true);
      await like(id);
      setLikedLocal(true);
      onLikedChange?.(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant={liked ? "default" : "outline"}
      size="default"
      disabled={pending || !!liked}
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
      aria-pressed={!!liked}
      className={cn("gap-2", className)}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className="h-4 w-4" />
      )}
      {liked ? "В избранном" : "В избранное"}
    </Button>
  );
}
