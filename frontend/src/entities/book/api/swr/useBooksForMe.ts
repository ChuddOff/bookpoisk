import { bookService } from "../book.service";
import { ENDPOINT } from "@/shared";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";
import type { Key } from "swr";

export function useBooksForMe(
  options?:
    | (SWRMutationConfiguration<
        { poll: string },
        any,
        Key,
        never,
        { poll: string }
      > & { throwOnError?: boolean })
    | undefined
) {
  const key = ENDPOINT.bookForMe;
  return useSWRMutation<{ poll: string }>(
    key,
    bookService.postBooksForMe,
    options
  );
}
