import { SWRConfig } from "swr";
import { toast } from "@/shared/ui/sonner";
import { UserX } from "lucide-react";

type AnyErr = unknown & {
  status?: number;
  response?: { status?: number };
  message?: string;
};

export function SWRProvider({ children }: React.PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 0,
        onError: (err: AnyErr) => {
          // единая обработка auth-ошибок
          const status = err?.status ?? err?.response?.status;
          if (status === 401) {
            toast.error("Не авторизованы", {
              description: err?.message ?? "Войдите в аккаунт",
              icon: <UserX />,
            });
          }
          if (status === 403) {
            toast.error("Нет прав", {
              description: err?.message ?? "Недостаточно прав",
              icon: <UserX />,
            });
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
