import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { QUERY_PARAMS } from "@/shared/constants/query";
import type { ListParams } from "@/entities/book/api/book.service";

const parseNum = (v: string | null, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
};
const parseCsv = (v: string | null): string[] | undefined =>
  v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
const toCsv = (arr?: string[]) =>
  arr && arr.length ? arr.join(",") : undefined;

export type QueryState = {
  page: number;
  per_page: number; // всегда 12, но хранить не мешает
  search?: string;
  authors?: string[];
  genres?: string[]; // жанры
  years?: string[]; // мультиренджи лет: "≤1950","1950-1990","≥2010"
  pages?: string[]; // мультиренджи страниц: "≤100","100-200","≥500"
};

export type PaginationActions = {
  setPage: (p: number) => void;
  setSearch: (s?: string) => void;
  setAuthors: (a?: string[]) => void;
  setgenres: (t?: string[]) => void;
  setYears: (y?: string[]) => void;
  setPages: (p?: string[]) => void;
  toggleTag: (t: string) => void;
  toggleYear: (y: string) => void;
  togglePages: (p: string) => void;
  reset: () => void;
  toApiParams: () => ListParams;
};

export type PaginationContextValue = QueryState & PaginationActions;
export const PaginationContext = React.createContext<
  PaginationContextValue | undefined
>(undefined);
export function usePagination() {
  const ctx = React.useContext(PaginationContext);
  if (!ctx)
    throw new Error("usePagination must be used within <PaginationProvider>");
  return ctx;
}

function fromSearchParams(sp: URLSearchParams): QueryState {
  return {
    page: parseNum(sp.get(QUERY_PARAMS.page), 1),
    per_page: 12,
    search: sp.get(QUERY_PARAMS.search) ?? undefined,
    authors: parseCsv(sp.get(QUERY_PARAMS.authors)),
    genres: parseCsv(sp.get("genres")), // добавили
    years: parseCsv(sp.get(QUERY_PARAMS.years)), // теперь массив
    pages: parseCsv(sp.get("pages")), // добавили
  };
}

function toSearchParams(state: QueryState): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set(QUERY_PARAMS.page, String(state.page));
  sp.set(QUERY_PARAMS.per_page, String(12));
  if (state.search) sp.set(QUERY_PARAMS.search, state.search);
  const authorsCsv = toCsv(state.authors);
  if (authorsCsv) sp.set(QUERY_PARAMS.authors, authorsCsv);
  const genresCsv = toCsv(state.genres);
  if (genresCsv) sp.set("genres", genresCsv);
  const yearsCsv = toCsv(state.years);
  if (yearsCsv) sp.set(QUERY_PARAMS.years, yearsCsv);
  const pagesCsv = toCsv(state.pages);
  if (pagesCsv) sp.set("pages", pagesCsv);
  return sp;
}

export function PaginationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sp, setSp] = useSearchParams();
  const [state, setState] = React.useState<QueryState>(() =>
    fromSearchParams(sp)
  );

  React.useEffect(() => {
    const next = fromSearchParams(sp);
    setState((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  React.useEffect(() => {
    window?.scrollTo?.({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [state.page]);

  const update = React.useCallback(
    (patch: Partial<QueryState>, opts?: { keepPage?: boolean }) => {
      setState((prev) => {
        const next: QueryState = {
          ...prev,
          ...patch,
          per_page: 12,
          page: opts?.keepPage ? patch.page ?? prev.page : patch.page ?? 1,
        };
        setSp(toSearchParams(next), { replace: true });
        return next;
      });
    },
    [setSp]
  );

  const toggleFrom = (list: string[] | undefined, v: string) => {
    const base = list ?? [];
    return base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
  };

  const actions: PaginationActions = {
    setPage: (p) => update({ page: Math.max(1, p) }, { keepPage: true }),
    setSearch: (s) => update({ search: s }),
    setAuthors: (a) => update({ authors: a }),
    setgenres: (t) => update({ genres: t }),
    setYears: (y) => update({ years: y }),
    setPages: (p) => update({ pages: p }),
    toggleTag: (t) => update({ genres: toggleFrom(state.genres, t) }),
    toggleYear: (y) => update({ years: toggleFrom(state.years, y) }),
    togglePages: (p) => update({ pages: toggleFrom(state.pages, p) }),
    reset: () =>
      update({
        search: undefined,
        authors: [],
        genres: [],
        years: [],
        pages: [],
      }),
    toApiParams: (): ListParams => ({
      page: state.page,
      per_page: 12,
      search: state.search,
      authors: state.authors,
      genres: state.genres,
      // бэку отдадим CSV, если он поддержит мультирендж
      years:
        state.years && state.years.length ? state.years.join(",") : undefined,
      // pages — тоже CSV; если бэк пока не принимает, он просто игнорирует параметр
      // @ts-expect-error бэк расширит контракт когда добавит фильтр по страницам
      pages:
        state.pages && state.pages.length ? state.pages.join(",") : undefined,
    }),
  };

  const value: PaginationContextValue = { ...state, ...actions };
  return (
    <PaginationContext.Provider value={value}>
      {children}
    </PaginationContext.Provider>
  );
}
