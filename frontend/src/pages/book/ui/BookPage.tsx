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

export function BookPage() {
  const { id } = useParams<{ id: string }>();
  const { data: resp, isLoading, error } = useBook(id);
  const [lbOpen, setLbOpen] = React.useState(false);

  if (isLoading) {
    return (
      <Container className="gap-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          <BlockSkeleton className="h-[360px]" />
          <div className="space-y-3">
            <BlockSkeleton className="h-7 w-2/3" />
            <BlockSkeleton className="h-5 w-1/3" />
            <BlockSkeleton className="h-24 w-full" />
          </div>
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

  const book = resp.data;
  const genres = Array.isArray(book.genre)
    ? book.genre
    : book.genre
    ? [book.genre]
    : [];
  const cover = book.cover || book.photos?.[0] || "";

  return (
    <Container className="gap-8">
      {/* Верхний блок: обложка + ключевая инфа */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Обложка */}
        <div className="rounded-xl border border-line bg-white p-3 shadow-card">
          {cover ? (
            <button
              className="block w-full"
              onClick={() => setLbOpen(true)}
              aria-label="Открыть изображение"
            >
              <img
                src={cover}
                alt={book.title}
                className="w-full h-auto rounded-lg object-cover"
              />
            </button>
          ) : (
            <div className="aspect-[3/4] w-full rounded-lg bg-soft" />
          )}
        </div>

        {/* Основные данные */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-ink">{book.title}</h1>
          <div className="text-slate-600">
            {book.author}
            {book.year ? ` • ${book.year}` : ""}
            {book.pages ? ` • ${book.pages} стр.` : ""}
          </div>

          {/* Жанры-«чипсы» */}
          {!!genres.length && (
            <div className="flex flex-wrap gap-2">
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

          {/* Действия */}
          <div className="flex gap-2">
            <LikeButton id={book.id} />
            <Button variant="outline" asChild>
              <Link to="/catalog">К каталогу</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Описание */}
      {book.description && (
        <section className="rounded-xl border border-line bg-white p-4 leading-relaxed text-slate-800">
          <h2 className="mb-2 text-lg font-semibold">Описание</h2>
          <ExpandableText text={book.description} />
        </section>
      )}

      {/* Похожие по первому жанру */}
      {genres[0] && (
        <SectionFeed
          title={`Похожие в жанре «${genres[0]}»`}
          params={{ page: 1, per_page: 10, genre: [genres[0]] }}
          moreHref={`/catalog?genre=${encodeURIComponent(genres[0])}`}
        />
      )}

      {/* Lightbox */}
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
