// src/features/favorites/api/useLikeBook.ts
import { useSWRConfig } from "swr";

import { bookService } from "@/entities/book"; // твой инстанс сервиса
import { toast } from "@/shared/ui";

/**
 * Возвращает обычную функцию (id) => Promise<void>,
 * чтобы в UI можно было делать: const like = useLikeBook(); await like(id)
 */
export function useLikeBook(): (id: string) => Promise<void> {
  const { mutate } = useSWRConfig();

  return async (bookId: string) => {
    await bookService.like(bookId);

    toast.success("Добавлено в избранное");

    // обновим кеши: избранное и, при желании, другие списки
    await Promise.all([
      mutate((key) => typeof key === "string" && key.includes("/bookForMe")),
      // при необходимости можно обновлять и каталоги/ленты:
      // mutate((key) => typeof key === "string" && key.startsWith("/book")),
    ]);
  };
}
