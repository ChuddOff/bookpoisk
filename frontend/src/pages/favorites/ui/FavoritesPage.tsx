// src/pages/favorites/ui/FavoritesPage.tsx
import * as React from "react";
import { useSWRConfig } from "swr";
import {
  FavoriteBooks,
  useBooksForMeCurrent,
  type BookEntity,
} from "@/entities/book";
import { useBooksForMe } from "@/entities/book/api/swr/useBooksForMe";

export function FavoritesPage() {
  const { trigger, isMutating } = useBooksForMe();
  const { trigger: triggerCurrent } = useBooksForMeCurrent();
  const { mutate } = useSWRConfig();
  //@ts-ignore
  const [ganres, setGanres] = React.useState<BookEntity[][]>([]);

  React.useEffect(() => {
    if (localStorage.getItem("poll")) {
    }
  }, []);

  const handleGenerate = React.useCallback(async () => {
    try {
      const res: string = (await trigger()).poll;
      localStorage.setItem("poll", res);
      triggerCurrent({ url: res });
    } catch (e: any) {
      console.error(e);
    }
  }, [mutate]);

  return (
    <>
      {!ganres.length && (
        <FavoriteBooks onClick={handleGenerate} generating={isMutating} />
      )}
    </>
  );
}
