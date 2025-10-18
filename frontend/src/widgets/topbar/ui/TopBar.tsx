import { Link } from "react-router-dom";
import { Heart, Search, User } from "lucide-react";

import { Button, Container } from "@/shared/ui";
import { MobileSearchDialog } from "./MobileSearchDialog";
import { SearchBar } from "./SearchBar";
import React from "react";

export function TopBar() {
  const [mOpen, setMOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-white/90 backdrop-blur">
      <Container className="py-3 gap-0">
        <div className="mx-auto max-w-[1440px] w-full flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight text-ink"
          >
            БуквАпоиск
          </Link>

          <div className="flex items-center gap-3 w-fit">
            <div className="hidden sm:block flex-1">
              <SearchBar className="w-[560px]" />
            </div>

            {/* мобилка: кнопка открытия полноэкранного поиска */}
            <div className="sm:hidden ml-auto">
              <Button
                variant="outline"
                onClick={() => setMOpen(true)}
                className="max-md:px-[11px]"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

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
        <MobileSearchDialog open={mOpen} onOpenChange={setMOpen} />
      </Container>
    </header>
  );
}
