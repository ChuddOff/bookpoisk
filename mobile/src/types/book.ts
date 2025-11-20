export interface BookEntity {
  id: string;
  title: string;
  author: string;
  year: string;
  description: string;
  genres: string[];
  cover?: string;
  photos?: string[];
  pages: number;
}

export interface PageMetaEntity {
  first: number;
  items: number;
  last: number;
  next: number | null;
  page: number;
  prev: number | null;
}

export interface PagedBooksEntity extends PageMetaEntity {
  data: BookEntity[];
}
