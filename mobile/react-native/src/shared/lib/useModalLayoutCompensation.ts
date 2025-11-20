import * as React from "react";

let lockCount = 0;
let savedOverflow = "";
let savedMarginRight = "";
let raf1 = 0;
let raf2 = 0;

function cancelRafs() {
  if (raf1) {
    cancelAnimationFrame(raf1);
    raf1 = 0;
  }
  if (raf2) {
    cancelAnimationFrame(raf2);
    raf2 = 0;
  }
}

function scrollbarWidth(): number {
  if (typeof window === "undefined") return 0;
  // ширина полосы прокрутки = ширина вьюпорта - клиентская ширина документа
  return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * Компенсирует исчезновение скроллбара через margin-right на <body>
 * и блокирует прокрутку через overflow:hidden.
 * Без padding'ов, без position:fixed, без scrollbar-gutter.
 */
export function useModalLayoutCompensation(active: boolean) {
  const wasActive = React.useRef(false);

  React.useLayoutEffect(() => {
    const body = document.body;

    const open = () => {
      lockCount++;
      if (lockCount !== 1) return;

      cancelRafs();

      // запомним инлайновые стили, чтобы вернуть как было
      savedOverflow = body.style.overflow;
      savedMarginRight = body.style.marginRight;

      const sw = scrollbarWidth();
      if (sw > 0) {
        // ключ: сдвигаем контент внутрь на ширину скроллбара
        body.style.marginRight = `${sw}px`;
      }

      // блокируем фон
      body.style.overflow = "hidden";
    };

    const close = () => {
      lockCount--;
      if (lockCount > 0) return;
      if (lockCount < 0) lockCount = 0;

      // 1) сразу вернём overflow, чтобы скроллбар мог появиться
      body.style.overflow = savedOverflow;

      // 2) а margin-right уберём через два кадра,
      //    когда браузер вернёт скроллбар и пересчитает лэйаут
      cancelRafs();
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (lockCount === 0) {
            body.style.marginRight = savedMarginRight;
          }
        });
      });
    };

    if (active && !wasActive.current) {
      wasActive.current = true;
      open();
    } else if (!active && wasActive.current) {
      wasActive.current = false;
      close();
    }

    return () => {
      if (wasActive.current) {
        wasActive.current = false;
        close();
      }
    };
  }, [active]);
}
