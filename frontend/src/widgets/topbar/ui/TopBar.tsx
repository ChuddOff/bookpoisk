import { Link } from "react-router-dom";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Book, Heart, Search, User } from "lucide-react";
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
            Буквопоиск
          </Link>

          <div className="flex items-center gap-3">
            {/* На планшете и выше показываем инпут, на мобиле — кнопка (потом откроем Sheet) */}
            <div className="hidden tablet:block">
              <Input
                placeholder="Найти книгу, автора, тег..."
                className="w-[380px]"
              />
            </div>
            <Button
              className="tablet:hidden max-md:px-[11px]"
              variant="outline"
            >
              <p className="max-xs:hidden">Поиск</p>
              <Search className="xs:hidden h-4 w-4" />
            </Button>

            <Button variant="outline" asChild className="max-md:px-[11px]">
              <Link
                to={
                  `/catalog?` +
                  new URLSearchParams({ page: "1", per_page: "12" })
                }
                className="flex items-center gap-2"
              >
                <Book className="h-4 w-4" />
                <span className="hidden md:inline">Каталог</span>
              </Link>
            </Button>

            <Button variant="outline" asChild className="max-md:px-[11px]">
              <Link to="/favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden md:inline">Избранное</span>
              </Link>
            </Button>

            <Button variant="outline" asChild className="max-md:px-[11px]">
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
