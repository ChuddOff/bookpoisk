import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import { bookService } from "../book.service";
import type { ListParams } from "../book.service"; // ← type-only импорт

import type { PagedBooksResponse } from "../../model/types";

export function useBooks(params?: ListParams, cfg?: SWRConfiguration) {
  const key = ["books", params] as const;
  return useSWR<PagedBooksResponse>(key, () => bookService.list(params), cfg);
}
