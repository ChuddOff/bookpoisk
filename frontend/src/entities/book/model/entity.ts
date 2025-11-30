// src/entities/book/model/entity.ts

/**
 * Сущность книги, используемая на фронтенде.
 */
export interface BookEntity {
  /** Уникальный идентификатор книги. */
  id: string;
  /** Название книги. */
  title: string;
  /** Имя автора. */
  author: string;
  /** Год публикации (строкой, как приходит с бэкенда). */
  year: string;
  /** Краткое описание/аннотация. */
  description: string;
  /** Жанр книги. */
  genres: string[];
  /** Ссылка на обложку, если доступна. */
  cover?: string;
  /** Дополнительные фотографии книги. */
  photos?: string[];
  /** Количество страниц. */
  pages: number;
}

/**
 * Метаданные пагинации, повторяют контракт бэкенда.
 */
export interface PageMetaEntity {
  /** Номер первой страницы (обычно 1). */
  first: number;
  /** Количество элементов на странице. */
  items: number;
  /** Номер последней доступной страницы. */
  last: number;
  /** Номер следующей страницы либо null, если её нет. */
  next: number | null;
  /** Текущий номер страницы. */
  page: number;
  /** Номер предыдущей страницы либо null, если её нет. */
  prev: number | null;
}

/**
 * Коллекция книг с метаданными пагинации.
 */
export interface PagedBooksEntity extends PageMetaEntity {
  /** Список книг для текущей страницы. */
  data: BookEntity[];
}
