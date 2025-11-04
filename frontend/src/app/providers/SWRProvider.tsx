import { SWRConfig } from "swr";

export function SWRProvider({ children }: React.PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}
