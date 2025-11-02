import useSWR, { type BareFetcher } from "swr";
import type { BookDto } from "@/entities/book/model";
import { bookService } from "../book.service";

type BookSWRKey = readonly ["book", string];

const fetcher: BareFetcher<BookDto> = async ([
  ,
  bookId,
]: BookSWRKey): Promise<BookDto> => {
  const result = await bookService.getById(bookId);

  // Check if result matches BookResponseDto type
  if (result && typeof result === "object" && "data" in result) {
    return result as BookDto;
  } else {
    throw new Error("Invalid response format");
  }
};

export function useBook(id?: string) {
  const key = id ? (["book", id] as const) : null;
  return useSWR<BookDto>(key, fetcher);
}
