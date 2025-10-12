import useSWR from "swr";
import { bookService } from "../book.service";
import type { BookResponse } from "@/entities/book/model/dto";

export function useBook(id?: string) {
  return useSWR<BookResponse>(id ? ["book", id] : null, ([, _id]) =>
    bookService.getById(_id as string)
  );
}
