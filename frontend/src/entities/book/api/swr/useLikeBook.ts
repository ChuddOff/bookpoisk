import useSWRMutation from "swr/mutation";
import type { Key } from "swr";
import { bookService } from "../book.service";

// Мутация лайка: вызывать trigger(id)
export function useLikeBook() {
  const key: Key = ["likeBook"]; // тип ключа — из swr
  return useSWRMutation(
    key,
    // ✅ Явно типизируем параметры, чтобы не было implicit any
    async (_key: Key, { arg }: { arg: string }) => {
      return bookService.like(arg);
    }
  );
}
