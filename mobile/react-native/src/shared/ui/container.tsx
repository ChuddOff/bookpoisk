import React from "react";
export function Container({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`mx-auto max-w-[1440px] px-[12px] min-[568px]:px-[18px] tablet:px-[24px] min-[992px]:px-[16px] min-[1200px]:px-[30px] lg:px-[60px] ${className}`}
    >
      {children}
    </div>
  );
}
