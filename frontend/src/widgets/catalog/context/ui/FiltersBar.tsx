import * as React from "react";
import { cn } from "@/shared/ui/cn";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { Checkbox } from "@/shared/ui/checkbox";
import { X } from "lucide-react";

type Option = { label: string; value: string };

const YEARS: Option[] = [
  { label: "До 1950", value: "≤1950" },
  { label: "1950–1990", value: "1950-1990" },
  { label: "1990–2010", value: "1990-2010" },
  { label: "После 2010", value: "≥2010" },
];

const GENRE: Option[] = [
  { label: "Фантастика", value: "sci-fi" },
  { label: "Фэнтези", value: "fantasy" },
  { label: "Детектив", value: "detective" },
  { label: "Нон-фикшн", value: "non-fiction" },
  { label: "Классика", value: "classic" },
  { label: "Манга", value: "manga" },
];

const PAGES: Option[] = [
  { label: "≤ 100 стр.", value: "≤100" },
  { label: "100–200", value: "100-200" },
  { label: "200–400", value: "200-400" },
  { label: "≥ 400", value: "≥400" },
];

type Props = {
  search?: string;
  years?: string[];
  genre?: string[];
  pages?: string[];
  onChange: (
    next: Partial<{
      search: string;
      years: string[];
      genre: string[];
      pages: string[];
    }>
  ) => void;
  className?: string;
};

/** Кнопка-поповер мультивыбора с поиском. */
function MultiSelect({
  title,
  placeholder,
  options,
  values = [],
  onToggle,
  onClear,
}: {
  title: string;
  placeholder: string;
  options: Option[];
  values?: string[];
  onToggle: (v: string) => void;
  onClear?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const count = values?.length ?? 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {title}
          {count ? ` · ${count}` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-72">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium">{title}</div>
          {count > 0 && (
            <button
              onClick={() => onClear?.()}
              className="text-xs text-slate-500 hover:text-ink inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Сбросить
            </button>
          )}
        </div>
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandGroup>
              {options.map((o) => {
                const checked = values?.includes(o.value) ?? false;
                return (
                  <CommandItem key={o.value} onSelect={() => onToggle(o.value)}>
                    <Checkbox className="mr-2" checked={checked} />
                    {o.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function FiltersBar({
  search,
  years,
  genre,
  pages,
  onChange,
  className,
}: Props) {
  const [local, setLocal] = React.useState(search ?? "");
  React.useEffect(() => setLocal(search ?? ""), [search]);
  React.useEffect(() => {
    const id = setTimeout(() => {
      if (local !== (search ?? "")) onChange({ search: local });
    }, 400);
    return () => clearTimeout(id);
  }, [local]);

  const toggle = (list: string[] | undefined, v: string) => {
    const base = list ?? [];
    return base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white p-3",
        "flex flex-wrap items-center gap-3", // нормальные gaps
        className
      )}
    >
      <Input
        placeholder="Поиск: книга, автор, тег…"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="w-full tablet:w-[360px]"
      />

      <MultiSelect
        title="Годы"
        placeholder="Найти диапазон…"
        options={YEARS}
        values={years}
        onToggle={(v) => onChange({ years: toggle(years, v) })}
        onClear={() => onChange({ years: [] })}
      />

      <MultiSelect
        title="Жанры"
        placeholder="Найти жанр…"
        options={GENRE}
        values={genre}
        onToggle={(v) => onChange({ genre: toggle(genre, v) })}
        onClear={() => onChange({ genre: [] })}
      />

      <MultiSelect
        title="Страницы"
        placeholder="Найти диапазон…"
        options={PAGES}
        values={pages}
        onToggle={(v) => onChange({ pages: toggle(pages, v) })}
        onClear={() => onChange({ pages: [] })}
      />

      <Button
        variant="ghost"
        className="ml-auto"
        onClick={() => {
          setLocal("");
          onChange({ search: "", years: [], genre: [], pages: [] });
        }}
      >
        Сбросить
      </Button>
    </div>
  );
}
