import * as React from "react";
import { useMe } from "@/entities/user"; // твой уже существующий хук профиля
import { SignInDialog } from "@/features/auth/ui/SignInDialog";
import { session } from "@/shared/auth/session";
import { apiService } from "@/shared/api/http.service";
import { ENDPOINT } from "@/shared/api/endpoints";
import type { AuthIntent } from "@/shared/lib/auth-intent";

type Ctx = {
  requireAuth: (intent?: AuthIntent) => boolean;
  openSignIn: (intent?: AuthIntent) => void;
  closeSignIn: () => void;
};
const AuthGateContext = React.createContext<Ctx | null>(null);

export function useRequireAuth() {
  const ctx = React.useContext(AuthGateContext);
  if (!ctx)
    throw new Error("useRequireAuth must be used inside <AuthGateProvider>");
  return ctx.requireAuth;
}

export function AuthGateProvider({ children }: React.PropsWithChildren) {
  const { data: me } = useMe();

  const [open, setOpen] = React.useState(false);
  const [intent, setIntent] = React.useState<AuthIntent | null>(null);

  // Тихий boot: если есть refresh-кука, попробуем получить access при первом заходе
  React.useEffect(() => {
    // Только если ещё нет access в RAM и нет me
    if (session.isAuth() || me) return;
    (async () => {
      try {
        const { access } = await apiService.post<{ access: string }>(
          ENDPOINT.auth.refresh
        );
        session.set(access);
      } catch {
        /* гость — ок */
      }
    })();
  }, [me]);

  const openSignIn = React.useCallback((i?: AuthIntent) => {
    setIntent(i ?? null);
    setOpen(true);
  }, []);

  const closeSignIn = React.useCallback(() => setOpen(false), []);

  const requireAuth = React.useCallback(
    (i?: AuthIntent) => {
      if (me || session.isAuth()) return true;
      openSignIn(i);
      return false;
    },
    [me, openSignIn]
  );

  const value = React.useMemo<Ctx>(
    () => ({ requireAuth, openSignIn, closeSignIn }),
    [requireAuth, openSignIn, closeSignIn]
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <SignInDialog
        open={open}
        onOpenChange={setOpen}
        intent={intent ?? undefined}
      />
    </AuthGateContext.Provider>
  );
}
