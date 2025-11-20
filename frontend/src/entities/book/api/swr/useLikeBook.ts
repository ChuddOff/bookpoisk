// src/features/favorites/api/useLikeBook.ts

import { bookService } from "@/entities/book"; // твой инстанс сервиса

/**
 * Возвращает обычную функцию (id) => Promise<void>,
 * чтобы в UI можно было делать: const like = useLikeBook(); await like(id)
 */
export function useLikeBook(): (id: string) => Promise<void> {
  return async (bookId: string) => {
    await bookService.like(bookId);
  };
}
