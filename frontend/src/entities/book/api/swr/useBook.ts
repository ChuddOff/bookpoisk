import useSWR, { type BareFetcher } from "swr";
import type { BookDto } from "@/entities/book/model";
import { bookService } from "../book.service";

type BookSWRKey = readonly ["book", string];

const fetcher: BareFetcher<BookDto> = async ([
  ,
  bookId,
]: BookSWRKey): Promise<BookDto> => {
  const result = await bookService.getById(bookId);

  return result as BookDto;
};

export function useBook(id?: string) {
  const key = id ? (["book", id] as const) : null;
  return useSWR<BookDto>(key, fetcher);
}
