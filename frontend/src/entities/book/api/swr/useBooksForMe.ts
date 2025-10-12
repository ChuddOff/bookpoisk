import useSWR from "swr";
import type { SWRConfiguration } from "swr";

import { bookService } from "../book.service";
import type { ForMeParams, PagedBooksResponse } from "@/entities/book";

export function useBooksForMe(params?: ForMeParams, cfg?: SWRConfiguration) {
  const key = ["booksForMe", params] as const;
  return useSWR<PagedBooksResponse>(key, () => bookService.forMe(params), cfg);
}
