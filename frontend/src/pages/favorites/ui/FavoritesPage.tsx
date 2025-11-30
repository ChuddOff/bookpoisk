// src/pages/favorites/ui/FavoritesPage.tsx
import * as React from "react";
import { useSWRConfig } from "swr";
import {
  FavoriteBooks,
  useBooksForMeCurrent,
  type BookEntity,
} from "@/entities/book";
import { useBooksForMe } from "@/entities/book/api/swr/useBooksForMe";
import { Button, Container } from "@/shared";
import { SectionFeed } from "@/widgets";
import { GeneratingComposer } from "@/widgets/generator/GeneratingComposer";
import { Loader2 } from "lucide-react";

export function FavoritesPage() {
  const { trigger, isMutating } = useBooksForMe();
  const { trigger: triggerCurrent, isMutating: isMutatingCurrent } =
    useBooksForMeCurrent();
  const { mutate } = useSWRConfig();
  //@ts-ignore
  const [ganres, setGanres] = React.useState<BookEntity[]>([]);
  const [started, setStarted] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (localStorage.getItem("poll")) {
    }
  }, []);

  const handleGenerate = React.useCallback(async () => {
    setStarted(true);
    try {
      const res: string = (await trigger()).poll;
      localStorage.setItem("poll", res);
      let books: BookEntity[] = await triggerCurrent({ url: res });
      while (!Array.isArray(books)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        books = await triggerCurrent({ url: res });
      }
      setStarted(false);
      setGanres(books);
    } catch (e: any) {
      console.error(e);
    }
  }, [mutate]);

  return (
    <Container className="gap-8">
      {!ganres.length && !started && (
        <FavoriteBooks onClick={handleGenerate} generating={isMutating} />
      )}
      {!ganres.length && started && <GeneratingComposer active />}
      {!!ganres.length && (
        <div className="flex flex-col items-center justify-between w-full">
          <div className="space-y-10 w-full">
            {!!ganres.slice(0, 8).length && (
              <SectionFeed
                key={0}
                books={ganres.slice(0, 8)}
                title={"Похожее"}
              />
            )}
            {!!ganres.slice(8, 16).length && (
              <SectionFeed
                key={1}
                books={ganres.slice(8, 16)}
                title={"Похожее"}
              />
            )}
            {!!ganres.slice(16, 24).length && (
              <SectionFeed
                key={2}
                books={ganres.slice(16, 24)}
                title={"Похожее"}
              />
            )}
          </div>
          <div className="mt-6 flex justify-center mx-auto">
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isMutatingCurrent || isMutating}
              className="flex items-center gap-3"
            >
              {isMutatingCurrent || isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Сгенерировать рекомендации повторно
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
