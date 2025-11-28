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
import type { GenresResponseDto } from "@/entities/book/model/dto";
import { AlertTriangle, Loader2 } from "lucide-react";

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
  const [started, setStarted] = React.useState<boolean>(false);
  const [errorStatus, setStatusError] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (localStorage.getItem("poll")) {
    }
  }, []);

  const handleGenerate = React.useCallback(async () => {
    setStarted(true);
    try {
      const res: string = (await trigger()).poll;
      localStorage.setItem("poll", res);
      let books: GenresResponseDto = await triggerCurrent({ url: res });
      while (books.status === "PENDING") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        books = await triggerCurrent({ url: res });
      }
      if (books.status === "FAILED") {
        setStatusError(true);
        return;
      }
      setStarted(false);
      setGanres(books.data);
    } catch (e: any) {
      console.error(e);
    }
  }, [mutate]);

  return (
    <Container className="gap-8">
      {!ganres.length && !started && (
        <FavoriteBooks onClick={handleGenerate} generating={isMutating} />
      )}
      {!ganres.length && started && <GeneratingComposer />}
      {!!ganres.length && (
        <div className="flex items-center justify-between">
          <div className="space-y-10">
            {ganres.map((books, i) => (
              <SectionFeed
                key={i}
                books={books}
                title={i === 2 ? "Выбор редакции" : categories[i]}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
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
      {error ||
        errorCurrent ||
        (errorStatus && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div className="text-sm">
              Не удалось сгенерировать рекомендации.
              <span className="text-slate-500">Проверьте подключение.</span>
            </div>
            <Button size="sm" className="ml-auto" onClick={() => trigger()}>
              Повторить
            </Button>
          </div>
        ))}
    </Container>
  );
}
