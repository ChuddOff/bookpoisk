import { bookService } from "../book.service";
import type { BookDto } from "../../model/dto";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";

type Arg = { url: string };

export function useBooksForMeCurrent(
  options?: SWRMutationConfiguration<BookDto[][], any, string, Arg> & {
    throwOnError?: boolean;
  }
) {
  return useSWRMutation<BookDto[][], any, string, Arg>(
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
