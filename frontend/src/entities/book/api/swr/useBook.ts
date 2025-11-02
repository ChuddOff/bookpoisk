import useSWR, { type BareFetcher } from "swr";
import type { BookResponseDto } from "@/entities/book/model";
import { bookService } from "../book.service";

type BookSWRKey = readonly ["book", string];

const fetcher: BareFetcher<BookResponseDto> = async ([
  ,
  bookId,
]: BookSWRKey): Promise<BookResponseDto> => {
  const result = await bookService.getById(bookId);

  // Check if result matches BookResponseDto type
  if (result && typeof result === "object" && "data" in result) {
    return result as BookResponseDto;
  } else {
    throw new Error("Invalid response format");
  }
};

export function useBook(id?: string) {
  const key = id ? (["book", id] as const) : null;
  return useSWR<BookResponseDto>(key, fetcher);
}
