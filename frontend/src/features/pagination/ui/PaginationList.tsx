import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  cn,
} from "@/shared/ui";

interface Props {
  onClick: (val: number) => void;
  page: number;
  last: number;
  add_page?: number;
  className?: string;
}

const stop = (e: any) => {
  e.stopPropagation?.();
  e.preventDefault?.();
};

export function PaginationList({
  onClick,
  page,
  last,
  add_page = 0,
  className,
}: Props) {
  const cur = page + add_page;
  const to = (n: number) => () => {
    if (n >= 1 && n <= last && n !== cur) onClick(n);
  };

  const disablePrev = cur === 1;
  const disableNext = cur === last;

  return (
    <Pagination className={className}>
      <PaginationContent className={cn("w-full justify-between")}>
        {/* Предыдущая */}
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={disablePrev}
            className={cn("opacity-100", disablePrev && "pointer-events-none")}
            onPointerDown={stop}
            onMouseDown={stop}
            onTouchStart={stop}
            onClick={disablePrev ? undefined : to(cur - 1)}
          />
        </PaginationItem>

        {/* Центр: номера/эллипсис (на tablet и выше) */}
        <div className="gap-x-0.5 mx-auto tablet:flex hidden">
          {/* 1 всегда */}
          <PaginationItem>
            <PaginationLink isActive={cur === 1} onClick={to(1)}>
              1
            </PaginationLink>
          </PaginationItem>

          {/* … после 1, если далеко */}
          {cur > 3 ? (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          ) : null}

          {/* первое «серединное» */}
          {last > 2 ? (
            <PaginationItem>
              <PaginationLink
                isActive={cur === 2}
                onClick={to(cur < 3 ? 2 : cur - 1)}
              >
                {cur < 3 ? 2 : cur - 1}
              </PaginationLink>
            </PaginationItem>
          ) : null}

          {/* второе «серединное» */}
          {last > 3 && cur !== last && cur !== 1 ? (
            <PaginationItem>
              <PaginationLink
                isActive={cur !== 2}
                onClick={to(cur === 2 ? 3 : cur)}
              >
                {cur === 2 ? 3 : cur}
              </PaginationLink>
            </PaginationItem>
          ) : null}

          {/* третье «серединное» */}
          {last > 4 && cur > 2 && cur < last - 1 ? (
            <PaginationItem>
              <PaginationLink onClick={to(cur + 1)}>{cur + 1}</PaginationLink>
            </PaginationItem>
          ) : null}

          {/* … перед последней */}
          {cur < last - 2 && last > 3 ? (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          ) : null}

          {/* последняя */}
          {last > 1 ? (
            <PaginationItem>
              <PaginationLink isActive={cur === last} onClick={to(last)}>
                {last}
              </PaginationLink>
            </PaginationItem>
          ) : null}
        </div>

        {/* Мобильная подпись */}
        <div className="tablet:hidden block">
          Страница {cur} из {last}
        </div>

        {/* Следующая */}
        <PaginationItem>
          <PaginationNext
            aria-disabled={disableNext}
            className={cn("opacity-100", disableNext && "pointer-events-none")}
            onPointerDown={stop}
            onMouseDown={stop}
            onTouchStart={stop}
            onClick={disableNext ? undefined : to(cur + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
