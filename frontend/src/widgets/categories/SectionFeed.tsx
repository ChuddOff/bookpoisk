import { Button } from "@/shared/ui/button";
import { HorizontalCarousel } from "@/widgets/carousels/HorizontalCarousel";
import { BookCard, BookCardSkeleton } from "@/entities/book/ui/BookCard";
import { useBooks } from "@/entities/book/api";
import type { ListParams } from "@/entities/book/api/book.service";
import { AlertTriangle } from "lucide-react";

type Props = { title: string; params: ListParams; moreHref?: string };

export function SectionFeed({ title, params, moreHref = "/catalog" }: Props) {
  const { isLoading, error, mutate, data } = useBooks({
    per_page: 10,
    page: 1,
    ...params,
  });

  const items = data?.data ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <Button variant="outline" asChild>
          <a
            href={`${moreHref}?${new URLSearchParams({
              genres: params.genres?.join(",") ?? "",
              page: "1",
              per_page: "12",
            }).toString()}`}
          >
            Ещё
          </a>
        </Button>
      </div>

      {isLoading && (
        <HorizontalCarousel autoplay loop={false}>
          {Array.from({ length: 10 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </HorizontalCarousel>
      )}

      {!isLoading && error && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
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
        <div className="rounded-xl border border-line bg-white p-4 text-sm text-slate-600">
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
