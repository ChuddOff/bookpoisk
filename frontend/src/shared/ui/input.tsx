import * as React from "react";

import { cn } from "@/shared";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-10 w-full rounded-full border border-line bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand/20 shadow-[inset_0_1px_0_rgba(17,20,24,.04)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
