import * as React from "react";
import { Check, X } from "lucide-react";

import {
  Button,
  Checkbox,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@/shared/ui";

// те же наборы опций, что в контексте
const YEARS = [
  { label: "До 1950", value: "≤1950" },
  { label: "1950–1990", value: "1950-1990" },
  { label: "1990–2010", value: "1990-2010" },
  { label: "После 2010", value: "≥2010" },
];
const GENRE = [
  { label: "Фантастика", value: "sci-fi" },
  { label: "Фэнтези", value: "fantasy" },
  { label: "Детектив", value: "detective" },
  { label: "Нон-фикшн", value: "non-fiction" },
  { label: "Классика", value: "classic" },
  { label: "Манга", value: "manga" },
];
const PAGES = [
  { label: "≤ 100 стр.", value: "≤100" },
  { label: "100–200", value: "100-200" },
  { label: "200–400", value: "200-400" },
  { label: "≥ 400", value: "≥400" },
];

type Props = {
  search?: string;
  year?: string; // одиночный токен
  genres?: string[]; // мульти
  pages?: string; // одиночный токен
  onChange: (
    next: Partial<{
      search: string;
      year: string | undefined;
      genres: string[];
      pages: string | undefined;
    }>
  ) => void;
  className?: string;
};

/** Мультиселект с чекбоксами (для жанров). */
function MultiSelect({
  title,
  placeholder,
  options,
  values = [],
  onToggle,
  onClear,
  className,
}: {
  title: string;
  placeholder: string;
  options: { label: string; value: string }[];
  values?: string[];
  onToggle: (v: string) => void;
  onClear?: () => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const count = values?.length ?? 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
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

/** Одиночный селект (поиск + чек-иконка), повторяет паттерн shadcn Command */
function SingleSelect({
  title,
  placeholder,
  options,
  value,
  onChange,
  className,
}: {
  title: string;
  placeholder: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange: (v: string | undefined) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          {selected ? `${title} · ${selected.label}` : title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-72">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium">{title}</div>
          {selected && (
            <button
              onClick={() => onChange(undefined)}
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
                const active = o.value === value;
                return (
                  <CommandItem
                    key={o.value}
                    onSelect={() => onChange(active ? undefined : o.value)}
                    className="flex items-center gap-2"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center">
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
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
  year,
  genres,
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
        "flex flex-wrap items-center gap-3 max-sm:flex-col w-full",
        className
      )}
    >
      <Input
        placeholder="Поиск: книга, автор…"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="w-full sm:w-[360px]"
      />

      <div className="flex gap-3 flex-1 w-full max-xs:flex-col">
        <SingleSelect
          title="Годы"
          placeholder="Найти диапазон…"
          options={YEARS}
          value={year}
          onChange={(v) => onChange({ year: v })}
          className="max-xs:flex-1"
        />

        <MultiSelect
          title="Жанры"
          placeholder="Найти жанр…"
          options={GENRE}
          values={genres}
          onToggle={(v) => onChange({ genres: toggle(genres, v) })}
          onClear={() => onChange({ genres: [] })}
          className="max-xs:flex-1"
        />

        <SingleSelect
          title="Страницы"
          placeholder="Найти диапазон…"
          options={PAGES}
          value={pages}
          onChange={(v) => onChange({ pages: v })}
          className="max-xs:flex-1"
        />

        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            setLocal("");
            onChange({
              search: "",
              year: undefined,
              genres: [],
              pages: undefined,
            });
          }}
        >
          Сбросить
        </Button>
      </div>
    </div>
  );
}
