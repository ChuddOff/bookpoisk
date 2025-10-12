// src/widgets/carousels/HorizontalCarousel.tsx
import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  cn,
} from "@/shared/ui";
import Autoplay from "embla-carousel-autoplay";

type Props = React.PropsWithChildren<{
  className?: string;
  /** ширина айтема */
  itemWidthClass?: string;
  /** шаг/отступы контейнера (левый минус, правый обычный) */
  gapClass?: string; // например: "pl-5 -ml-5 pr-5"
  /** дополнительный gap для каждого айтема (перебьёт дефолтный pl-4 у CarouselItem) */
  itemGapClass?: string; // например: "pl-5" или "pl-6"
  /** внутренний паддинг вокруг стрелок */
  outerPadClass?: string; // например: "px-8"
  controls?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  edgeFade?: boolean;
}>;

export function HorizontalCarousel({
  children,
  className,
  itemWidthClass = "max-tablet:basis-[200px] basis-[265px] flex gap-4",
  gapClass = "pr-6", // ⬅ симметричный шаг 20px
  itemGapClass = "", // ⬅ gap между карточками
  outerPadClass = "tablet:px-8",
  controls = true,
  loop = true,
  autoplay = false,
  edgeFade = true,
}: Props) {
  const items = React.Children.toArray(children).filter(Boolean);

  // ⬇ автоплей: останавливаем при hover, ВОЗОБНОВЛЯЕМ при mouseleave
  const plugins = React.useMemo(() => {
    if (!autoplay) return [];
    return [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false, // не отключать навсегда после кликов/драга
        stopOnMouseEnter: true, // стоп при hover
        rootNode: (emblaRoot) => emblaRoot.parentElement!, // шире область наведения
      }),
    ];
  }, [autoplay]);

  return (
    <div className={cn("relative group", className)}>
      {edgeFade && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-soft to-transparent rounded-l-xl" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-soft to-transparent rounded-r-xl" />
        </>
      )}

      <div className={outerPadClass}>
        <Carousel
          className="relative"
          opts={{
            align: "start",
            loop,
            containScroll: "trimSnaps",
            skipSnaps: false,
          }}
          plugins={plugins}
        >
          {/* ВАЖНО: без -mr-* справа, чтобы последний слайд не резался */}
          <CarouselContent className={gapClass}>
            {items.map((child, idx) => (
              <CarouselItem
                key={idx}
                className={cn(itemWidthClass, itemGapClass)}
              >
                {child}
              </CarouselItem>
            ))}
          </CarouselContent>
          {controls && (
            <>
              <CarouselPrevious className="opacity-0 group-hover:opacity-100 tablet:opacity-100 transition-opacity !-left-[35px] max-tablet:!hidden" />
              <CarouselNext className="opacity-0 group-hover:opacity-100 tablet:opacity-100 transition-opacity !-right-[35px] max-tablet:!hidden" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
}
