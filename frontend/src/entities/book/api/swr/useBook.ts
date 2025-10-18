import useSWR from "swr";

import type { BookResponseDto } from "@/entities/book/model";
import { bookService } from "../book.service";

type BookSWRKey = readonly ["book", string];

export function useBook(id?: string) {
  const key = id ? (["book", id] as const) : null;
  return useSWR<BookResponseDto>(key, ([, bookId]: BookSWRKey) =>
    bookService.getById(bookId)
  );
}
