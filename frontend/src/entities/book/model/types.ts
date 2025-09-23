// src/entities/book/model/types.ts
export interface Book {
  id: string;
  title: string;
  author: string;
  year: string;
  description: string;
  genre: string;
  tag?: string[];
  cover?: string;
  photos?: string[];
  pages: number;
}

// Пагинация как прислал бэк
export interface PageMeta {
  first: number;
  items: number;
  last: number;
  next: number | null;
  page: number;
  prev: number | null;
}

export interface PagedBooksResponse {
  data: {
    data: Book[];
    first: number;
    items: number;
    last: number;
    next: number | null;
    page: number;
    prev: number | null;
  };
}
