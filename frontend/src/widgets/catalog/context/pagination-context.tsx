import * as React from "react";
import { useSearchParams } from "react-router-dom";

import { type ListParams } from "@/entities/book";
import { QUERY_PARAMS } from "@/shared/constants";

const MIN_YEAR = 1000;
const MAX_PAGES = 100000;
const CURRENT_YEAR = new Date().getFullYear();

const parseIntOrUndef = (v: string | null) =>
  v == null ? undefined : Number.parseInt(v, 10);

// ---- Опции (те же value, что в FiltersBar)
type RangeOption = { label: string; value: string };
export const YEAR_OPTIONS: RangeOption[] = [
  { label: "До 1950", value: "≤1950" },
  { label: "1950–1990", value: "1950-1990" },
  { label: "1990–2010", value: "1990-2010" },
  { label: "После 2010", value: "≥2010" },
];
export const PAGES_OPTIONS: RangeOption[] = [
  { label: "≤ 100 стр.", value: "≤100" },
  { label: "100–200", value: "100-200" },
  { label: "200–400", value: "200-400" },
  { label: "≥ 400", value: "≥400" },
];

// ---- Маппинг value -> пар (from,to)
function yearPairFromValue(v?: string): { from?: number; to?: number } {
  switch (v) {
    case "≤1950":
      return { from: MIN_YEAR, to: 1950 };
    case "1950-1990":
      return { from: 1950, to: 1990 };
    case "1990-2010":
      return { from: 1990, to: 2010 };
    case "≥2010":
      return { from: 2010, to: CURRENT_YEAR };
    default:
      return {};
  }
}
function yearValueFromPair(from?: number, to?: number): string | undefined {
  if (from === MIN_YEAR && to === 1950) return "≤1950";
  if (from === 1950 && to === 1990) return "1950-1990";
  if (from === 1990 && to === 2010) return "1990-2010";
  if (from === 2010 && (to == null || to >= CURRENT_YEAR)) return "≥2010";
  return undefined;
}
function pagesPairFromValue(v?: string): { from?: number; to?: number } {
  switch (v) {
    case "≤100":
      return { from: 0, to: 100 };
    case "100-200":
      return { from: 100, to: 200 };
    case "200-400":
      return { from: 200, to: 400 };
    case "≥400":
      return { from: 400, to: MAX_PAGES };
    default:
      return {};
  }
}
function pagesValueFromPair(from?: number, to?: number): string | undefined {
  if (from === 0 && to === 100) return "≤100";
  if (from === 100 && to === 200) return "100-200";
  if (from === 200 && to === 400) return "200-400";
  if (from === 400 && (to == null || to >= MAX_PAGES)) return "≥400";
  return undefined;
}

export type QueryState = {
  page: number;
  per_page: number; // фикс 12
  search?: string;
  authors?: string[];
  genres?: string[]; // мультивыбор жанров
  year?: string; // одиночный токен из YEAR_OPTIONS.value
  pages?: string; // одиночный токен из PAGES_OPTIONS.value
};

export type PaginationActions = {
  setPage: (p: number) => void;
  setSearch: (s?: string) => void;
  setAuthors: (a?: string[]) => void;
  setGenres: (g?: string[]) => void;
  setYear: (v?: string) => void;
  setPages: (v?: string) => void;
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
  const yearFrom = parseIntOrUndef(sp.get("yearFrom"));
  const yearTo = parseIntOrUndef(sp.get("yearTo"));
  const pageFrom = parseIntOrUndef(sp.get("pageFrom")); // ⬅️
  const pageTo = parseIntOrUndef(sp.get("pageTo")); // ⬅️

  return {
    page: Number.parseInt(sp.get(QUERY_PARAMS.page) ?? "1", 10) || 1,
    per_page: 12,
    search: sp.get(QUERY_PARAMS.search) ?? undefined,
    authors: sp.get(QUERY_PARAMS.authors)?.split(",").filter(Boolean),
    genres: sp.get("genres")?.split(",").filter(Boolean),
    year: yearValueFromPair(yearFrom, yearTo),
    pages: pagesValueFromPair(pageFrom, pageTo), // ⬅️ используем пары page*
  };
}

function toSearchParams(state: QueryState): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set(QUERY_PARAMS.page, String(state.page));
  sp.set(QUERY_PARAMS.per_page, String(12));
  if (state.search) sp.set(QUERY_PARAMS.search, state.search);
  if (state.authors?.length)
    sp.set(QUERY_PARAMS.authors, state.authors.join(","));
  if (state.genres?.length) sp.set("genres", state.genres.join(","));

  const yp = yearPairFromValue(state.year);
  if (yp.from != null) sp.set("yearFrom", String(yp.from));
  else sp.delete("yearFrom");
  if (yp.to != null) sp.set("yearTo", String(yp.to));
  else sp.delete("yearTo");

  const pp = pagesPairFromValue(state.pages);
  if (pp.from != null) sp.set("pageFrom", String(pp.from));
  else sp.delete("pageFrom"); // ⬅️
  if (pp.to != null) sp.set("pageTo", String(pp.to));
  else sp.delete("pageTo"); // ⬅️

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

  const actions: PaginationActions = {
    setPage: (p) => update({ page: Math.max(1, p) }, { keepPage: true }),
    setSearch: (s) => update({ search: s }),
    setAuthors: (a) => update({ authors: a }),
    setGenres: (g) => update({ genres: g }),
    setYear: (v) => update({ year: v }),
    setPages: (v) => update({ pages: v }),
    reset: () =>
      update({
        search: undefined,
        authors: [],
        genres: [],
        year: undefined,
        pages: undefined,
      }),
    toApiParams: (): ListParams => {
      const yp = yearPairFromValue(state.year);
      const pp = pagesPairFromValue(state.pages);
      return {
        page: state.page,
        per_page: 12,
        search: state.search,
        authors: state.authors,
        genres: state.genres,
        yearFrom: yp.from,
        yearTo: yp.to,
        pageFrom: pp.from,
        pageTo: pp.to,
      };
    },
  };

  const value: PaginationContextValue = { ...state, ...actions };
  return (
    <PaginationContext.Provider value={value}>
      {children}
    </PaginationContext.Provider>
  );
}
