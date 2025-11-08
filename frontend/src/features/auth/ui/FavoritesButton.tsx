// src/features/auth/ui/CabinetButton.tsx
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button, cn } from "@/shared/ui";
import { useRequireAuth } from "@/app/providers/AuthGateProvider";

export function FavoritesButton({ className }: { className?: string }) {
  const requireAuth = useRequireAuth();

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    // если пользователь не авторизован — открываем модалку и блокируем навигацию
    const ok = requireAuth({ type: "goto", href: "/favorites" });
    if (!ok) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Button
      variant="outline"
      asChild
      className={cn("max-md:px-[11px]", className)}
    >
      <Link
        to="/favorites"
        onClick={handleClick}
        className="flex items-center gap-2"
      >
        <Heart className="h-4 w-4" />
        <span className="hidden md:inline">Избранное</span>
      </Link>
    </Button>
  );
}
