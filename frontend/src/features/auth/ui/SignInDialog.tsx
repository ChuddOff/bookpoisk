import * as React from "react";
import { useSignInWithGoogle } from "@/entities/auth";
import { AuthIntentStore, type AuthIntent } from "@/shared/lib/auth-intent";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { useModalLayoutCompensation } from "@/shared/lib/useModalLayoutCompensation";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** намерение, которое нужно возобновить после входа (сохраним в sessionStorage) */
  intent?: AuthIntent | null;
};

export function SignInDialog({ open, onOpenChange, intent }: Props) {
  useModalLayoutCompensation(open);
  const { signIn } = useSignInWithGoogle();

  const start = React.useCallback(() => {
    if (intent) AuthIntentStore.save(intent);
    const next = window.location.pathname + window.location.search;
    signIn({ next });
  }, [intent, signIn]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] !animate-none">
        <DialogHeader>
          <DialogTitle>Вход</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Чтобы продолжить, войдите через Google. Мы не передаём ваш userId в
          запросах — сервер определяет вас по токену.
        </p>
        <div className="mt-4 flex gap-2">
          <Button className="w-full" onClick={start}>
            Войти через Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
