import * as React from "react";
import { Link, useParams } from "react-router-dom";

import { useBook } from "@/entities/book";
import { LikeButton } from "@/features/favorites";
import { SectionFeed } from "@/widgets/categories";
import { Button, Container, CustomLightbox } from "@/shared/ui";

/** Локальный скелетон без зависимостей */
function BlockSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-soft ${className}`} />;
}

/** Пара «ключ–значение» в таблице характеристик */
function SpecRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-b last:border-b-0 border-line/70">
      <div className="text-xs uppercase tracking-wide text-slate-500 flex items-center p-3">
        {label}
      </div>
      <div className="text-slate-800 flex items-center p-3">{value}</div>
    </div>
  );
}

export function BookPage() {
  const { id } = useParams<{ id: string }>();
  const { data: resp, isLoading, error } = useBook(id);
  const [lbOpen, setLbOpen] = React.useState(false);

  console.log(resp);
  console.log(error);

  if (isLoading) {
    return (
      <Container className="gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <BlockSkeleton className="h-[420px]" />
          <BlockSkeleton className="h-[420px]" />
        </div>
      </Container>
    );
  }

  if (error || !resp) {
    return (
      <Container className="gap-6">
        <div className="rounded-xl border border-line bg-white p-6">
          Не удалось загрузить книгу.
        </div>
      </Container>
    );
  }

  const book = resp;
  const genres = Array.isArray(book.genre)
    ? book.genre
    : book.genre
    ? [book.genre]
    : [];
  const cover = book.cover || book.photos?.[0] || "";

  return (
    <Container className="gap-10">
      {/* БЫЛО: flex gap-6 items-start max-xs:flex-col */}
      {/* МОЖНО ОСТАВИТЬ FLEX, НО ЗАДАТЬ ПРАВИЛЬНЫЕ ОГРАНИЧЕНИЯ */}
      <div className="flex gap-6 items-start max-xs:flex-col">
        {/* LEFT: запретить shrink и зафиксировать базис */}
        <div
          className="
        shrink-0 basis-[360px]
        max-lg:basis-[300px] max-md:basis-[260px]
        max-xs:basis-auto max-xs:w-full
        rounded-xl border border-line bg-white p-3 shadow-card
        max-xs:mx-auto max-xs:max-w-[400px]
      "
        >
          {cover ? (
            <button
              className="block w-full cursor-pointer"
              onClick={() => setLbOpen(true)}
              aria-label="Открыть изображение"
            >
              <img
                src={cover}
                alt={book.title}
                className="w-full h-auto rounded-xl object-cover"
              />
            </button>
          ) : (
            <div className="aspect-[3/4] w-full rounded-lg bg-soft" />
          )}
        </div>

        {/* RIGHT: дать колонке гибко занимать остаток и позволить контенту сжиматься */}
        <div className="flex-1 min-w-0 rounded-xl border border-line bg-white p-4 md:p-6 shadow-card">
          {/* Заголовок и действия */}
          <div className="flex justify-between gap-4 items-start">
            <h1 className="text-2xl font-bold text-ink break-words">
              {book.title}
            </h1>
            <div className="shrink-0 flex gap-3 max-tablet:hidden">
              <LikeButton id={book.id} />
              <Button variant="outline" asChild>
                <Link to="/catalog">К каталогу</Link>
              </Button>
            </div>
          </div>

          {/* Аннотация */}
          {book.description && (
            <section className="mt-2">
              <h2 className="mb-2 text-lg font-semibold">Аннотация</h2>
              {/* чтобы длинные слова не расширяли колонку */}
              <div className="break-words">
                <ExpandableText text={book.description} />
              </div>
            </section>
          )}

          {/* Таблица характеристик */}
          <section className="mt-2">
            <div className="rounded-lg border border-line/70">
              <SpecRow label="Автор" value={book.author} />
              <SpecRow label="Издательство" value={(book as any).publisher} />
              <SpecRow
                label="Страниц"
                value={book.pages ? String(book.pages) : undefined}
              />
              <SpecRow label="Год издания" value={book.year} />
              <SpecRow label="Тираж" value={(book as any).printRun} />
            </div>
          </section>

          <div className="shrink-0 flex gap-2 mt-2 tablet:hidden flex-col-reverse">
            <LikeButton id={book.id} />
            <Button variant="outline" asChild>
              <Link to="/catalog">К каталогу</Link>
            </Button>
          </div>

          {!!genres.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-full border border-line bg-soft px-3 py-1 text-xs text-slate-700"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Похожие по первому жанру */}
      {genres[0] && (
        <SectionFeed
          title={`Похожие в жанре «${genres[0]}»`}
          params={{ page: 1, per_page: 10, genres: [genres[0]] }}
          moreHref={`/catalog?genres=${encodeURIComponent(genres[0])}`}
          className="mt-3"
        />
      )}

      {/* Лайтбокс */}
      {cover && (
        <CustomLightbox
          src={cover}
          alt={book.title}
          open={lbOpen}
          onOpenChange={setLbOpen}
        />
      )}
    </Container>
  );
}

function ExpandableText({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  const limit = 600;
  const isCut = text.length > limit;
  const short = isCut ? text.slice(0, limit) + "…" : text;

  return (
    <div>
      <p className="whitespace-pre-wrap">{open || !isCut ? text : short}</p>
      {isCut && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Свернуть" : "Читать дальше"}
        </Button>
      )}
    </div>
  );
}
