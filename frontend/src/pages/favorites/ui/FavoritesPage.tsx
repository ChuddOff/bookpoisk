// src/pages/favorites/ui/FavoritesPage.tsx
import * as React from "react";
import { useSWRConfig } from "swr";
import {
  FavoriteBooks,
  useBooksForMeCurrent,
  type BookEntity,
} from "@/entities/book";
import { useBooksForMe } from "@/entities/book/api/swr/useBooksForMe";
import { Container } from "@/shared";
import { SectionFeed } from "@/widgets";
import { GeneratingComposer } from "@/widgets/generator/GeneratingComposer";

const categories: string[] = ["Похожее", "Что-то новое"];

export function FavoritesPage() {
  const { trigger, isMutating, error } = useBooksForMe();
  const {
    trigger: triggerCurrent,
    isMutating: isMutatingCurrent,
    error: errorCurrent,
  } = useBooksForMeCurrent();
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
      const books: BookEntity[][] = await triggerCurrent({ url: res });
      setGanres(books);
    } catch (e: any) {
      console.error(e);
    }
  }, [mutate]);

  return (
    <Container className="gap-8">
      {!ganres.length &&
        !error &&
        !errorCurrent &&
        !isMutatingCurrent &&
        !isMutating && (
          <FavoriteBooks onClick={handleGenerate} generating={isMutating} />
        )}
      {(!!isMutatingCurrent || !!error || !!errorCurrent) && (
        <GeneratingComposer
          active={true}
          titles={["Похожее", "Что-то новое", "Выбор редакции"]}
          skeletonPerSection={8}
          totalDuration={60000}
        />
      )}
      {!!ganres.length && (
        <div className="space-y-10">
          {ganres.map((_, i) => (
            <SectionFeed
              key={i}
              title={i === 2 ? "Выбор редакции" : categories[i]}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
