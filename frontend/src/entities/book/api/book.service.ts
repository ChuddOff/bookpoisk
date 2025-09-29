// src/entities/book/api/book.service.ts
import { apiService, type ApiService } from "@/shared/api/http.service";
import { ENDPOINT } from "@/shared/api/endpoints";
import type { PagedBooksResponse } from "../model/types";

// ✅ ИМЕННО export type ...
export type ListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  genres?: string[];
  authors?: string[];
  years?: string;
};

export type ForMeParams = { page?: number; per_page?: number };

export class BookService {
  private readonly api: ApiService;
  constructor(api: ApiService = apiService) {
    this.api = api;
  }

  list(params?: ListParams) {
    return this.api.get<PagedBooksResponse>(ENDPOINT.book, params);
  }

  forMe(params?: ForMeParams) {
    return this.api.get<PagedBooksResponse>(ENDPOINT.bookForMe, params);
  }

  like(id: string) {
    return this.api.post<void>(ENDPOINT.likeBook, undefined, { id });
  }
}

export const bookService = new BookService();
