import useSWR, { type SWRConfiguration } from "swr";

import type { PagedBooksResponseDto } from "@/entities/book/model";
import { bookService } from "../book.service";
import { ENDPOINT } from "@/shared";

export function useLikedBooksMe(cfg?: SWRConfiguration<PagedBooksResponseDto>) {
  const key = ENDPOINT.likedBooks;
  return useSWR<PagedBooksResponseDto>(
    key,
    () => bookService.likedBooks(),
    cfg
  );
}
