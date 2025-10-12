import { BookCard, BookCardSkeleton, type Book } from "@/entities/book";

export function BookGrid({
  items,
  loading,
}: {
  items: Book[];
  loading?: boolean;
}) {
  const gridCls =
    "grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-md:gap-3";

  if (loading) {
    return (
      <div className={gridCls}>
        {Array.from({ length: 12 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={gridCls}>
      {items.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}
