import type { Book } from "./types";

export type BookResponse = {
  data: Book;
};

export type PagedBooksResponse = {
  data: {
    data: Book[];
    first: number;
    items: number;
    last: number;
    next: number | null;
    page: number;
    prev: number | null;
  };
};

export type OkResponse = {
  data?: unknown;
  success?: boolean;
  message?: string;
};

export type GenresDto = string[] | { data: string[] };
