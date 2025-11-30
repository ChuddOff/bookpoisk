import { AlertTriangle } from "lucide-react";

import {
  BookCard,
  BookCardSkeleton,
  useBooks,
  type BookEntity,
  type ListParams,
} from "@/entities/book";
import { HorizontalCarousel } from "@/widgets/carousels";
import { Button, cn } from "@/shared/ui";

type Props = {
  title: string;
  params?: ListParams;
  moreHref?: string;
  books?: BookEntity[];
  className?: string;
  moreButton?: boolean;
};

export function SectionFeed({
  title,
  params,
  className,
  books,
  moreHref = "/catalog",
  moreButton = true,
}: Props) {
  const { isLoading, error, mutate, data } = useBooks({
    per_page: 10,
    page: 1,
    ...params,
  });

  const items = books ?? data?.data ?? [];

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {moreButton && (
          <Button variant="outline" asChild>
            <a
              href={`${moreHref}?${new URLSearchParams({
                genres: params?.genres?.join(",") ?? "",
                page: "1",
                per_page: "12",
              }).toString()}`}
            >
              Ещё
            </a>
          </Button>
        )}
      </div>

      {isLoading && (
        <HorizontalCarousel autoplay loop={false}>
          {Array.from({ length: 10 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </HorizontalCarousel>
      )}

      {!isLoading && error && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="text-sm">
            Не удалось загрузить раздел.{" "}
            <span className="text-slate-500">Проверьте подключение.</span>
          </div>
          <Button size="sm" className="ml-auto" onClick={() => mutate()}>
            Повторить
          </Button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-line bg-white p-3 text-sm text-slate-600">
          В этом разделе пока пусто.
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <HorizontalCarousel autoplay loop={false}>
          {items.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
}
