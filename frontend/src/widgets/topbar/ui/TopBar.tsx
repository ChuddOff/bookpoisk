import { Link } from "react-router-dom";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Heart, User } from "lucide-react";
import { Container } from "@/shared";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-white/90 backdrop-blur">
      <Container className="py-3 gap-0">
        <div className="mx-auto max-w-[1440px] w-full flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight text-ink"
          >
            Буквапоиск
          </Link>

          <div className="flex items-center gap-3">
            {/* На планшете и выше показываем инпут, на мобиле — кнопка (потом откроем Sheet) */}
            <div className="hidden tablet:block">
              <Input
                placeholder="Найти книгу, автора, тег..."
                className="w-[380px]"
              />
            </div>
            <Button className="tablet:hidden" variant="outline">
              Поиск
            </Button>

            <Button variant="outline" asChild>
              <Link to="/favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden md:inline">Избранное</span>
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Кабинет</span>
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
