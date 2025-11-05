// src/app/providers/AuthGateProvider.tsx
import * as React from "react";
import { useMe } from "@/entities/user"; // твой хук профиля (SWR)
import { SignInDialog } from "@/features/auth/ui/SignInDialog";
import type { AuthIntent } from "@/shared/lib/auth-intent";
import { getAccessToken, saveTokenStorage } from "@/shared/auth/session";
import { authService } from "@/shared";

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

  // Boot: если у нас ещё нет me и нет access в памяти/куках — попробуем refresh (cookie-based)
  React.useEffect(() => {
    // если уже есть профиль или уже есть access — ничего не делаем
    if (me) return;
    const access = getAccessToken();
    if (access) {
      // access уже есть — useMe должен подтянуть профиль сам
      return;
    }

    // пробуем обновить (в беке refresh должен смотреть HttpOnly cookie и вернуть новый access)
    let mounted = true;
    (async () => {
      try {
        const res = await authService.refresh();
        // apiService.post возвращает уже распарсенный body — подстраивай тип под свой бек
        const accessToken =
          (res && (res as any)?.access) ?? (res as any)?.accessToken ?? null;
        if (accessToken && mounted) {
          // сохраняем токен (в куку, и/или в память — в зависимости от реализации saveTokenStorage)
          try {
            saveTokenStorage(accessToken);
          } catch (e) {
            // noop: всё равно позже useMe может подтянуть профиль
            console.warn("saveTokenStorage failed", e);
          }
        }
      } catch {
        // гость — ок, ничего не делаем
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const openSignIn = React.useCallback((i?: AuthIntent) => {
    setIntent(i ?? null);
    setOpen(true);
  }, []);

  const closeSignIn = React.useCallback(() => setOpen(false), []);

  const requireAuth = React.useCallback(
    (i?: AuthIntent) => {
      const access = getAccessToken();
      if (me || access) return true;
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
