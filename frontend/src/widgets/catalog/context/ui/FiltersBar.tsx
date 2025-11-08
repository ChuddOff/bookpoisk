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
  Dialog,
  DialogContent,
  DialogOverlay,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@/shared/ui";
import { useBookGenres } from "@/entities/book";
import { useIsMobile } from "@/shared/lib/useIsMobile";
import { useDebouncedValue } from "@/shared/lib/hooks/useDebouncedValue";
import { ScrollArea } from "@/shared/ui/scroll-area";

// те же наборы опций, что в контексте
const YEARS = [
  { label: "До 1950", value: "≤1950" },
  { label: "1950–1990", value: "1950-1990" },
  { label: "1990–2010", value: "1990-2010" },
  { label: "После 2010", value: "≥2010" },
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

type Option = { label: string; value: string };

/** Мультиселект с чекбоксами (для жанров). */
function MultiSelect({
  title,
  placeholder,
  options,
  values = [],
  onToggle,
  onClear,
  className,
  maxRender = 200,
  onApply,
}: {
  title: string;
  placeholder?: string;
  options: Option[];
  values?: string[];
  onToggle: (v: string) => void;
  onClear?: () => void;
  className?: string;
  maxRender?: number;
  onApply?: (vals: string[]) => void;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  // локальный поисковый стейт + дебаунс
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 180); // 180ms — плавно и быстро

  // мемоизированная фильтрация (без учёта регистра)
  const filtered = React.useMemo(() => {
    if (!debouncedSearch) return options;
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      // простая проверка: label включает query или value включает
      return (
        (o.label && o.label.toLowerCase().includes(q)) ||
        (o.value && o.value.toLowerCase().includes(q))
      );
    });
  }, [options, debouncedSearch]);

  // переключатель "показать всё", чтобы при очень большом количестве не рендерить всё по умолчанию
  const [showAll, setShowAll] = React.useState(false);
  React.useEffect(() => {
    // при каждом открытии сбрасываем локальные контролы (можешь изменить)
    if (!open) {
      setSearch("");
      setShowAll(false);
    }
  }, [open]);

  const count = values?.length ?? 0;
  const totalFound = filtered.length;
  const shown = showAll ? filtered : filtered.slice(0, maxRender);
  const needTruncate = filtered.length > maxRender;

  // оптимизация: мемоизируем линию элементов, чтобы не перегружать виртуальные рендеры
  const list = React.useMemo(
    () =>
      shown.map((o) => {
        const checked = values.includes(o.value);
        return (
          <CommandItem
            key={o.value}
            onSelect={() => onToggle(o.value)}
            className="flex items-center gap-2"
          >
            <Checkbox className="mr-2" checked={checked} />
            <div className="truncate">{o.label}</div>
            {checked ? (
              <Check className="ml-auto h-4 w-4 text-emerald-600" />
            ) : null}
          </CommandItem>
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, values] // onToggle не включаю нарочно, чтобы не ломать referential equality; если линтер ругается — добавь
  );

  const [localSelected, setLocalSelected] = React.useState<string[]>(
    values ?? []
  );

  // при открытии диалога синхронизируем локальный стейт с пропом values
  React.useEffect(() => {
    if (open) {
      setLocalSelected(Array.isArray(values) ? [...values] : []);
    }
  }, [open]);

  // focus control: на десктопе можно фокусировать CommandInput по-умолчанию.
  // на мобилке удобнее автофокус в Dialog (DialogContent -> Input autoFocus).
  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={className}>
            {title}
            {count ? ` · ${count}` : ""}
          </Button>
        </PopoverTrigger>

        <PopoverContent side="bottom" align="start" className="p-0 w-80">
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

          <div className="p-2">
            {/* CommandInput поддерживает controlled интерфейс в shadcn -> onValueChange/value */}
            <Command>
              <CommandInput
                placeholder={placeholder}
                value={search}
                onValueChange={(v: string) => setSearch(v)}
                // чтобы избежать лишних scrollIntoView в CommandInput,
                // можно отключить autofocus — но оставим поведение по умолчанию
              />
              <CommandList>
                <CommandGroup>{list}</CommandGroup>
              </CommandList>
            </Command>

            {needTruncate && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Показано{" "}
                  {showAll ? totalFound : Math.min(maxRender, totalFound)} из{" "}
                  {totalFound}
                </div>
                <button
                  className="cursor-pointer"
                  onClick={() => setShowAll((s) => !s)}
                >
                  {showAll ? "Свернуть" : "Показать всё"}
                </button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // --- МОБИЛКА: full-screen Dialog c обычным Input (устойчивее при клавиатуре)
  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
      >
        {title}
        {values?.length ? ` · ${values.length}` : ""}
        {totalFound ? (
          <span className="ml-2 text-xs text-slate-500">({totalFound})</span>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="fixed inset-0 z-[79] bg-black/30" />

        {/* DialogContent — full-screen, высота через --vh */}
        <DialogContent
          hideClose
          style={{
            height: "calc(var(--vh, 1vh) * 100)",
          }}
          className={cn(
            "fixed left-0 top-0 z-[80] m-0 w-full max-w-none rounded-none border-0 p-0",
            "translate-x-0 translate-y-0 !animate-none"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b p-3">
              <div className="text-sm font-medium">{title}</div>
              {values && values.length > 0 ? (
                <button
                  onClick={() => onClear?.()}
                  className="text-xs text-slate-500 hover:text-ink inline-flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Сбросить
                </button>
              ) : null}
            </div>

            {/* truncate info */}
            {needTruncate && (
              <div className="mt-3 flex items-center justify-between text-sm text-slate-500 px-3">
                <div>
                  Показано{" "}
                  {showAll ? totalFound : Math.min(maxRender, totalFound)} из{" "}
                  {totalFound}
                </div>
                <button className="" onClick={() => setShowAll((s) => !s)}>
                  {showAll ? "Свернуть" : "Показать всё"}
                </button>
              </div>
            )}

            {/* INPUT */}
            <div className="px-3 pt-3 pb-2">
              <Input
                autoFocus
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* SCROLL AREA: занимает оставшуюся высоту минус footer.
                Внутри мы добавили pb равный FOOTER_HEIGHT, чтобы содержимое не перекрывалось фикс- футером. */}
            <div
              className="flex-1 px-3 pb-0"
              style={{ minHeight: 0 /* важно для flex overflow */ }}
            >
              {/* Если у тебя есть ScrollArea в shared/ui — используем его */}
              {/* ScrollArea должен занимать всю площадь, внутри — список */}
              <ScrollArea
                style={{ height: "calc(100vh - 73px - 60px - 46px - 40px)" }}
                className="w-full"
              >
                <div className="flex flex-col gap-2 pt-1">
                  {shown.length === 0 ? (
                    <div className="p-2 text-sm text-slate-600">
                      Ничего не найдено.
                    </div>
                  ) : (
                    shown.map((o) => {
                      const checked = localSelected.includes(o.value);
                      return (
                        <button
                          key={o.value}
                          onClick={() => {
                            setLocalSelected((prev) =>
                              prev.includes(o.value)
                                ? prev.filter((x) => x !== o.value)
                                : [...prev, o.value]
                            );
                          }}
                          className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-soft"
                          type="button"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={checked} />
                            <div className="truncate">{o.label}</div>
                          </div>
                          {checked ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* ------------- Если у тебя НЕТ ScrollArea:
                  замени блок <ScrollArea>...</ScrollArea> на:
                <div className="h-full overflow-y-auto pb-[90px] -webkit-overflow-scrolling-touch">
                  ...тот же контент...
                </div>
                 и удали импорты ScrollArea.
              ------------- */}
            </div>

            {/* Footer: фиксируется поверх, всегда видно */}
            <div
              className="absolute left-0 right-0 bottom-0 z-[90] border-t bg-white p-6 cursor-pointer"
              style={{
                boxShadow: "0 -6px 18px rgba(17,20,24,0.06)",
              }}
              onClick={() => {
                // при наличии onApply — вызываем его с локальным списком
                if (typeof onApply === "function") {
                  onApply(localSelected);
                } else {
                  // бэкапный вариант: если onApply не передан — эмулируем поведение старого API:
                  // сначала очищаем, затем поочередно вызываем onToggle для всех выбранных (это небезопасно в некоторых случаях,
                  // но служит как fallback)
                  onClear?.();
                  // дать небольшой таймаут, чтобы parent успел применить clear (можно убрать, если у тебя onChange синхронный)
                  setTimeout(() => {
                    localSelected.forEach((v) => onToggle?.(v));
                  }, 0);
                }
                setOpen(false);
              }}
            >
              <p className="text-[16px] select-none text-center">Готово</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

  // const toggle = (list: string[] | undefined, v: string) => {
  //   const base = list ?? [];
  //   return base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
  // };

  const { data: genresFromApi } = useBookGenres();
  const GENRE_OPTIONS = (genresFromApi ?? []).map((g) => ({
    label: g,
    value: g,
  }));

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
          options={GENRE_OPTIONS}
          values={genres} // ⚠️ use your prop name; мы договорились использовать множественное: genres: string[]
          onToggle={(v) =>
            onChange({
              genres: (genres ?? []).includes(v)
                ? (genres ?? []).filter((x) => x !== v)
                : [...(genres ?? []), v],
            })
          }
          onApply={(vals: string[]) => onChange({ genres: vals })}
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
