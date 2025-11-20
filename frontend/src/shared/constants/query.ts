export const QUERY_PARAMS = {
  page: "page",
  per_page: "per_page",
  search: "search",
  authors: "authors",
  yearFrom: "yearFrom",
  yearTo: "yearTo",
  pageFrom: "pageFrom",
  pageTo: "pageTo",
} as const;

export type QueryParamKey = (typeof QUERY_PARAMS)[keyof typeof QUERY_PARAMS];
