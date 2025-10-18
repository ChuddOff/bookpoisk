import useSWR, { type SWRConfiguration } from "swr";

import type { ForMeParams } from "@/entities/book/api/book.service";
import type { PagedBooksResponseDto } from "@/entities/book/model";
import { bookService } from "../book.service";

export function useBooksForMe(
  params?: ForMeParams,
  cfg?: SWRConfiguration<PagedBooksResponseDto>
) {
  const key = params ? ["bookForMe", params] : ["bookForMe"];
  return useSWR<PagedBooksResponseDto>(key, () => bookService.forMe(params), cfg);
}
