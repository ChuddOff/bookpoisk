import { Button } from "@/shared/ui";
import { useLogout } from "@/entities/auth";

export function LogoutButton({ className }: { className?: string }) {
  const { logout, isLoading } = useLogout();
  return (
    <Button
      variant="outline"
      className={className}
      disabled={isLoading}
      onClick={() => logout()}
    >
      Выйти
    </Button>
  );
}
