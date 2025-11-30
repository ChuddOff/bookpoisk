// src/widgets/generator/TypingText.tsx
import React from "react";

type Props = {
  text: string;
  speed?: number; // ms per char
  className?: string;
  onDone?: () => void;
  showCursor?: boolean;
  cursor?: React.ReactNode;
};

export function TypingText({
  text,
  speed = 30,
  className,
  onDone,
  showCursor = true,
  cursor = (
    <span className="inline-block w-[6px] align-middle animate-pulse text-[8px] ml-[6px]">
      ⚫
    </span>
  ),
}: Props) {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    setIdx(0);
    if (!text) {
      onDone?.();
      return;
    }

    let cancelled = false;
    const delay = Math.max(8, speed);
    const step = () => {
      if (cancelled) return;
      setIdx((s) => {
        const next = s + 1;
        if (next >= text.length) {
          onDone?.();
          return text.length;
        }
        return next;
      });
    };

    // печатаем символы с интервалом delay
    const t = setInterval(step, delay);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return (
    <span className={className}>
      {text.slice(0, idx)}
      {showCursor && idx < text.length ? cursor : null}
    </span>
  );
}
