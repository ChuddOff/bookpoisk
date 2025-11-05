import useSWR, { type SWRConfiguration } from "swr";
import type { ListParams } from "@/entities/book/api/book.service";
import type { PagedBooksResponseDto } from "@/entities/book/model";
import { bookService } from "../book.service";

export function useBooks(
  params?: ListParams,
  cfg?: SWRConfiguration<PagedBooksResponseDto>
) {
  // Create a unique key based on the params
  const key = params ? [`books`, JSON.stringify(params)] : "books";

  // Define the fetcher function
  const fetcher = async (): Promise<PagedBooksResponseDto> => {
    return bookService.list(params);
  };

  return useSWR<PagedBooksResponseDto>(key, fetcher, cfg);
}
