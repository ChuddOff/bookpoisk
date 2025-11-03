// src/features/favorites/api/useLikeBook.ts

import { bookService } from "@/entities/book"; // твой инстанс сервиса
import { toast } from "@/shared/ui";

/**
 * Возвращает обычную функцию (id) => Promise<void>,
 * чтобы в UI можно было делать: const like = useLikeBook(); await like(id)
 */
export function useUnlikeBook(): (id: string) => Promise<void> {
  return async (bookId: string) => {
    await bookService.unlike(bookId);

    toast.success("Удалено из избранного");
  };
}
