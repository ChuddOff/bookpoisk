import { ENDPOINT } from "./endpoints";
import { http } from "./http";
import type { BookEntity, PagedBooksEntity } from "@/types/book";

export type ListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  authors?: string[];
  genres?: string[];
  yearFrom?: number;
  yearTo?: number;
  pageFrom?: number;
  pageTo?: number;
};

function buildQuery(params?: ListParams) {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export class BookService {
  async list(params?: ListParams): Promise<PagedBooksEntity> {
    const qs = buildQuery(params);
    const res = await http.get<PagedBooksEntity>(`${ENDPOINT.books}${qs}`);
    return res.data;
  }

  async likedBooks() {
    const res = await http.get<{ data: BookEntity[] } | BookEntity[]>(ENDPOINT.likedBooks);
    const raw = res.data as any;
    if (Array.isArray(raw)) return raw;
    return raw?.data ?? [];
  }

  async like(id: string) {
    await http.post<void>(ENDPOINT.likeBook, { id });
  }

  async unlike(id: string) {
    await http.post<void>(ENDPOINT.unlikeBook, { data: { id } });
  }

  async getById(id: string) {
    const res = await http.get<BookEntity | { data: BookEntity }>(`${ENDPOINT.book}/${id}`);
    const data: any = res.data;
    return (data?.data as BookEntity) ?? (data as BookEntity);
  }

  async genres() {
    const res = await http.get<string[] | { data: string[] }>(ENDPOINT.genres);
    const raw = res.data as any;
    const list: string[] = Array.isArray(raw) ? raw : raw?.data ?? [];
    const cleaned = list
      .map((s) => String(s ?? "").trim())
      .filter((s) => s.length > 0 && !s.includes(","));
    return Array.from(new Set(cleaned));
  }
}

export const bookService = new BookService();
