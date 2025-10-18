import useSWR from "swr";

import type { BookResponseDto } from "@/entities/book/model";
import { bookService } from "../book.service";

export function useBook(id?: string) {
  return useSWR<BookResponseDto>(id ? ["book", id] : null, ([, _id]) =>
    bookService.getById(_id)
  );
}
