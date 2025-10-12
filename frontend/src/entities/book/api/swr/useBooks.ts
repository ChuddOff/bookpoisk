import useSWR from "swr";
import type { SWRConfiguration } from "swr";

import { bookService } from "../book.service";
import type { ListParams, PagedBooksResponse } from "@/entities/book";

export function useBooks(params?: ListParams, cfg?: SWRConfiguration) {
  const key = ["books", params] as const;
  return useSWR<PagedBooksResponse>(key, () => bookService.list(params), cfg);
}
