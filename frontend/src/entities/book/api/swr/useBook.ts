import useSWR from "swr";

import type { BookResponse } from "@/entities/book";
import { bookService } from "../book.service";

export function useBook(id?: string) {
  return useSWR<BookResponse>(id ? ["book", id] : null, ([, _id]) =>
    bookService.getById(_id as string)
  );
}
