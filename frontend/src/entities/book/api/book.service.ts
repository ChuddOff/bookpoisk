// src/entities/book/api/book.service.ts
import { apiService, type ApiService, ENDPOINT } from "@/shared/api";
import type {
  BookResponseDto,
  PagedBooksResponseDto,
  GenresDto,
} from "@/entities/book/model";

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

export type ForMeParams = { page?: number; per_page?: number };

export class BookService {
  private readonly api: ApiService;
  constructor(api: ApiService = apiService) {
    this.api = api;
  }

  list(params?: ListParams) {
    return this.api.get<PagedBooksResponseDto>(ENDPOINT.books, params);
  }

  forMe(params?: ForMeParams) {
    return this.api.get<PagedBooksResponseDto>(ENDPOINT.bookForMe, params);
  }

  like(id: string) {
    return this.api.post<void>(ENDPOINT.likeBook, undefined, { id });
  }

  getById(id: string) {
    return this.api
      .get<BookResponseDto | any>(`${ENDPOINT.book}/${id}`)
      .then((r: any) =>
        r && typeof r === "object" && "data" in r
          ? (r as BookResponseDto)
          : ({ data: r } as BookResponseDto)
      );
  }

  genres() {
    return this.api.get<GenresDto>(ENDPOINT.genres);
  }
}

export const bookService = new BookService();
