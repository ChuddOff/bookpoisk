import type { BookEntity, PageMetaEntity } from "./entity";

/** DTO книги — напрямую повторяет сущность. */
export type BookDto = BookEntity;

/** DTO для списка книг с пагинацией. */
export type PagedBooksDto = PageMetaEntity & {
  /** Список книг, полученный от API. */
  data: BookEntity[];
};

export interface BookResponseDto {
  data: BookDto;
}

export type PagedBooksResponseDto = PagedBooksDto;

export type LikedBooks = {
  data: BookEntity[];
};

export interface OkResponseDto {
  data?: unknown;
  success?: boolean;
  message?: string;
}

export type GenresDto =
  | Array<BookEntity["genre"]>
  | {
      data: Array<BookEntity["genre"]>;
    };
