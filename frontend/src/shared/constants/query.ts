export const QUERY_PARAMS = {
  page: "page",
  per_page: "per_page",
  search: "search",
  authors: "authors",
  years: "years",
  genre: "genre",
} as const;

export type QueryParamKey = (typeof QUERY_PARAMS)[keyof typeof QUERY_PARAMS];
