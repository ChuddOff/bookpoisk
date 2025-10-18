import type { BookEntity, PagedBooksEntity } from "./entity";

export interface BookResponseDto {
  data: BookEntity;
}

export interface PagedBooksResponseDto {
  data: PagedBooksEntity;
}

export interface OkResponseDto {
  data?: unknown;
  success?: boolean;
  message?: string;
}

export type GenresDto = Array<BookEntity["genre"]> | {
  data: Array<BookEntity["genre"]>;
};
