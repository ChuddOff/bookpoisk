// src/entities/book/api/book.service.ts

import type {
  BookResponseDto,
  PagedBooksResponseDto,
  GenresDto,
  BookDto,
  BookEntity,
} from "@/entities/book/model";
import { ENDPOINT, getKey } from "@/shared";
import { http, httpAuth } from "@/shared/api/axios";
import type { LikedBooks } from "../model/dto";

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

export class BookService {
  list(params?: ListParams): Promise<PagedBooksResponseDto> {
    return http
      .get<PagedBooksResponseDto>(getKey(ENDPOINT.books, params))
      .then((res) => res.data);
  }

  likedBooks() {
    return http.get<LikedBooks>(ENDPOINT.likedBooks).then((res) => res.data);
  }

  like(id: string) {
    return httpAuth
      .post<void>(ENDPOINT.likeBook, { id })
      .then((res) => res.data);
  }

  unlike(id: string) {
    return httpAuth
      .post<void>(ENDPOINT.unlikeBook, { data: { id } })
      .then((res) => res.data);
  }

  getById(id: string) {
    return http
      .get<BookDto | any>(`${ENDPOINT.book}/${id}`)
      .then((r: any) =>
        r && typeof r === "object" && "data" in r
          ? (r as BookResponseDto)
          : ({ data: r } as BookResponseDto)
      )
      .then((res) => res.data);
  }

  async postBooksForMe() {
    const res = await httpAuth
      .post<{ poll: string }>(ENDPOINT.bookForMe)
      .then((res) => res.data);
    return res;
  }

  async postBooksForMeCurrent(url: string) {
    const res = await httpAuth.post<BookEntity[]>(url).then((res) => res.data);
    return res;
  }

  genres() {
    return http.get<GenresDto>(ENDPOINT.genres).then((res) => res.data);
  }
}

export const bookService = new BookService();
