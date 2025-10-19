import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFinishLogin } from "@/entities/auth";
import { AuthIntentStore } from "@/shared/lib/auth-intent";
import { apiService } from "@/shared/api/http.service";
import { ENDPOINT } from "@/shared/api/endpoints";
import { Loader2 } from "lucide-react";

export function AuthDonePage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { finishLogin } = useFinishLogin();

  React.useEffect(() => {
    (async () => {
      try {
        await finishLogin();

        // возобновим намерение, если было
        const intent = AuthIntentStore.take();
        if (intent?.type === "like-book") {
          try {
            await apiService.post<void>(ENDPOINT.likeBook, undefined, {
              id: intent.bookId,
            });
          } catch {
            /* молча игнорим */
          }
        } else if (intent?.type === "goto") {
          // просто перейдём по адресу
          nav(intent.href, { replace: true });
          return;
        }

        const next = sp.get("next") || "/";
        nav(next, { replace: true });
      } catch {
        nav("/", { replace: true });
      }
    })();
  }, [finishLogin, nav, sp]);

  return (
    <div className="flex h-[60vh] items-center justify-center text-slate-600">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Завершаем вход…
    </div>
  );
}
