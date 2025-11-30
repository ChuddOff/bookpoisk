import type { BookEntity } from "../../model";
import { bookService } from "../book.service";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";

type Arg = { url: string };

export function useBooksForMeCurrent(
  options?:
    | (SWRMutationConfiguration<BookEntity[], any, string, Arg> & {
        throwOnError?: boolean;
      })
    | undefined
) {
  return useSWRMutation<BookEntity[], any, string, Arg>(
    "postBooksForMe",
    // mutationFn принимает (key, { arg })
    //@ts-ignore
    async (key, { arg }) => {
      if (!arg?.url) throw new Error("url is required");
      return bookService.postBooksForMeCurrent(arg.url);
    },
    options
  );
}
