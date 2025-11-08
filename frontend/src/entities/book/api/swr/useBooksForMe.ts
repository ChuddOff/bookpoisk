import { bookService } from "../book.service";
import { ENDPOINT } from "@/shared";
import type { BookDto } from "../../model/dto";
import type { BookEntity } from "../../model";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";
import type { Key } from "swr";

export function useBooksForMe(
  config?:
    | (SWRMutationConfiguration<BookEntity[], any, Key, never, BookEntity[]> & {
        throwOnError?: boolean;
      })
    | undefined
) {
  const key = ENDPOINT.bookForMe;
  return useSWRMutation<BookDto[]>(key, bookService.postBooksForMe, config);
}
