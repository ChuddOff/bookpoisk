import { PaginationList } from "@/features/pagination/ui/PaginationList";

export function PaginationBar({
  page,
  last,
  onPage,
}: {
  page: number;
  last: number;
  onPage: (p: number) => void;
}) {
  return <PaginationList page={page} last={last} onClick={onPage} />;
}
