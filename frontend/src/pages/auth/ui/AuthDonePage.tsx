import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/shared/api/http.service";
import { Loader2 } from "lucide-react";
import { session } from "@/shared/auth/session";

export function AuthDonePage() {
  const [search] = useSearchParams();
  const nav = useNavigate();

  React.useEffect(() => {
    async function finish() {
      const code = search.get("code");
      const state = search.get("state"); // опционально
      if (!code) {
        nav("/");
        return;
      }

      try {
        // В prod лучше POST /auth/complete с телом { code, state } (зависит от бекенда)
        const res = await apiService.post<{ access?: string; next?: string }>(
          "/auth/complete",
          { code, state }
        );

        if (res?.access) {
          session.set(res.access);
        }

        // Можно также запросить /user здесь, если нужно обновить UI:
        // const me = await apiService.get("/user");

        nav(res?.next ?? "/");
      } catch (err) {
        console.error("Auth complete failed", err);
        nav("/");
      }
    }

    finish();
  }, [search, nav]);

  return (
    <div className="flex h-[60vh] items-center justify-center text-slate-600">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Завершаем вход…
    </div>
  );
}
