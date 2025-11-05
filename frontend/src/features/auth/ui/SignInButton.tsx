import { Button } from "@/shared/ui";
import { useSignInWithGoogle } from "@/entities/auth";

export function SignInButton({ className }: { className?: string }) {
  const { signIn } = useSignInWithGoogle();
  return (
    <Button
      className={className}
      onClick={() => signIn({ next: window.location.pathname })}
    >
      Войти через Google
    </Button>
  );
}
