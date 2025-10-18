import useSWR, { type SWRConfiguration } from "swr";

import type { ListParams } from "@/entities/book/api/book.service";
import type { PagedBooksResponseDto } from "@/entities/book/model";
import { bookService } from "../book.service";

export function useBooks(
  params?: ListParams,
  cfg?: SWRConfiguration<PagedBooksResponseDto>
) {
  const key = params ? ["books", params] : ["books"];
  return useSWR<PagedBooksResponseDto>(key, () => bookService.list(params), cfg);
}
