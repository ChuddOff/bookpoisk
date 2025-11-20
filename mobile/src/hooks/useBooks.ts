import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookService, type ListParams } from "@/api/bookService";
import type { BookEntity, PagedBooksEntity } from "@/types/book";

const queryKeys = {
  list: (params?: ListParams) => ["books", params],
  book: (id?: string) => ["book", id],
  genres: ["genres"],
  favorites: ["favorites"]
};

export function useGenres() {
  return useQuery({ queryKey: queryKeys.genres, queryFn: () => bookService.genres() });
}

export function useBooks(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: () => bookService.list(params)
  });
}

export function useInfiniteBooks(params?: ListParams) {
  return useInfiniteQuery<PagedBooksEntity>({
    initialPageParam: 1,
    queryKey: queryKeys.list(params),
    queryFn: ({ pageParam }) => bookService.list({ ...params, page: Number(pageParam) }),
    getNextPageParam: (last) => last.next ?? undefined
  });
}

export function useBook(id?: string) {
  return useQuery({
    enabled: !!id,
    queryKey: queryKeys.book(id),
    queryFn: () => bookService.getById(id!)
  });
}

export function useFavorites() {
  return useQuery<BookEntity[]>({ queryKey: queryKeys.favorites, queryFn: () => bookService.likedBooks() });
}

export function useToggleFavorite(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (liked: boolean) => {
      if (!id) return;
      if (liked) {
        await bookService.unlike(id);
      } else {
        await bookService.like(id);
      }
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.favorites });
      await client.invalidateQueries({ queryKey: queryKeys.book(id) });
    }
  });
}

export function useFavoritesHelpers() {
  const { data: favorites } = useFavorites();
  const isFavorite = (bookId?: string) => {
    if (!bookId) return false;
    return !!favorites?.some((b) => b.id === bookId);
  };
  return { favorites: favorites ?? [], isFavorite };
}
