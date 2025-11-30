import { bookService } from "../book.service";
import type { GenresResponseDto } from "../../model/dto";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";

type Arg = { url: string };

export function useBooksForMeCurrent(
  options?:
    | (SWRMutationConfiguration<GenresResponseDto, any, string, Arg> & {
        throwOnError?: boolean;
      })
    | undefined
) {
  return useSWRMutation<GenresResponseDto, any, string, Arg>(
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
