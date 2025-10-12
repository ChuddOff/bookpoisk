// src/entities/book/api/book.service.ts
import { apiService, type ApiService } from "@/shared/api/http.service";
import { ENDPOINT } from "@/shared/api/endpoints";
import type { PagedBooksResponse } from "../model/types";
import type { BookResponse } from "../model/dto";

export type ListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  authors?: string[];
  genre?: string[];
  yearFrom?: number;
  yearTo?: number;
  pageFrom?: number;
  pageTo?: number;
};

export type ForMeParams = { page?: number; per_page?: number };

export class BookService {
  private readonly api: ApiService;
  constructor(api: ApiService = apiService) {
    this.api = api;
  }

  list(params?: ListParams) {
    return this.api.get<PagedBooksResponse>(ENDPOINT.books, params);
  }

  forMe(params?: ForMeParams) {
    return this.api.get<PagedBooksResponse>(ENDPOINT.bookForMe, params);
  }

  like(id: string) {
    return this.api.post<void>(ENDPOINT.likeBook, undefined, { id });
  }

  getById(id: string) {
    return this.api
      .get<BookResponse | any>(ENDPOINT.book, { id })
      .then((r: any) =>
        r && typeof r === "object" && "data" in r
          ? (r as BookResponse)
          : ({ data: r } as BookResponse)
      );
  }
}

export const bookService = new BookService();
