import type React from "react";

/** Останавливает переход по Link/клик по карточке */
export function stopEvent(e: React.SyntheticEvent) {
  e.preventDefault();
  e.stopPropagation();
}
