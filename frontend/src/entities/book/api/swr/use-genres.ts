import useSWR, { type BareFetcher, type SWRConfiguration } from "swr";
import { ENDPOINT } from "@/shared/api/endpoints";
import { bookService } from "../book.service";

/** Чистим жанры: убираем с запятыми, trim, без пустых, без дублей. */
const fetchGenres: BareFetcher<string[]> = async () => {
  const raw = await bookService.genres(); // string[] | { data: string[] }
  const list: string[] = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];

  const cleaned = list
    .map((s) => String(s ?? "").trim())
    .filter((s): s is string => s.length > 0 && !s.includes(","));

  // уникальные в исходном порядке
  return Array.from(new Set<string>(cleaned));
};

export function useBookGenres(cfg?: SWRConfiguration<string[], any>) {
  return useSWR<string[]>(ENDPOINT.genres, fetchGenres, cfg);
}
