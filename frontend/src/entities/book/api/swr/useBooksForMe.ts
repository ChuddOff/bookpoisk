import useSWR, { type BareFetcher, type SWRConfiguration } from "swr";
import { bookService } from "../book.service";
import { ENDPOINT } from "@/shared";
import type { LikedBooks } from "../../model/dto";

export function useLikedBooksMe(
  config?:
    | SWRConfiguration<LikedBooks, any, BareFetcher<LikedBooks>>
    | undefined
) {
  const key = ENDPOINT.likedBooks;
  return useSWR<LikedBooks>(key, () => bookService.likedBooks(), config);
}
