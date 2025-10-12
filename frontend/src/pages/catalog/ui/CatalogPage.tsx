import { AlertTriangle } from "lucide-react";

import { useBooks } from "@/entities/book";
import {
  BookGrid,
  FiltersBar,
  PaginationBar,
  PaginationProvider,
  usePagination,
} from "@/widgets/catalog";
import { Button, Container } from "@/shared/ui";

function CatalogInner() {
  const {
    search,
    year,
    genre,
    pages,
    setSearch,
    setYear,
    setGenre,
    setPages,
    page,
    setPage,
    toApiParams,
  } = usePagination();

  const { data, isLoading, error, mutate } = useBooks(toApiParams());

  const pageData = data?.data;
  const items = data?.data ?? [];
  const last = data?.last ?? 1;

  console.log(pageData);

  return (
    <Container className="flex flex-col gap-[24px] max-md:gap-3">
      <FiltersBar
        search={search}
        year={year}
        genre={genre}
        pages={pages}
        onChange={(n) => {
          if ("search" in n) setSearch(n.search);
          if ("year" in n) setYear(n.year);
          if ("genre" in n) setGenre(n.genre);
          if ("pages" in n) setPages(n.pages);
        }}
      />

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="text-sm">
            Не удалось загрузить каталог.{" "}
            <span className="text-slate-500">Проверьте подключение.</span>
          </div>
          <Button size="sm" className="ml-auto" onClick={() => mutate()}>
            Повторить
          </Button>
        </div>
      ) : null}

      {!error ? (
        <>
          <BookGrid items={items} loading={isLoading} />
          {last > 1 && (
            <PaginationBar page={page} last={last} onPage={(p) => setPage(p)} />
          )}
          {!isLoading && items.length === 0 && (
            <div className="rounded-xl border border-line bg-white p-6 text-sm text-slate-600">
              По заданным фильтрам ничего не найдено.
            </div>
          )}
        </>
      ) : null}
    </Container>
  );
}

export function CatalogPage() {
  return (
    <PaginationProvider>
      <CatalogInner />
    </PaginationProvider>
  );
}
