// src/widgets/generator/GeneratingComposer.tsx
import * as React from "react";
import { TypingText } from "./TypingText";
import { BookCardSkeleton } from "@/entities/book/ui/BookCard";
import { HorizontalCarousel } from "@/widgets/carousels";
import { cn } from "@/shared/ui/cn";

type Props = {
  className?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const COMMENT_TEMPLATES = [
  "Добавляю «{title}» — кажется, она подходит по тону.",
  "Эта книга подходит по теме — включаю.",
  "У неё хороший отклик в похожих подборках — беру.",
  "Она усиливает подборку, поэтому добавляю.",
  "Похоже, эта книга отлично вписывается — добавляю.",
  "Выглядит релевантно — добавляю «{title}».",
  "Книга с нужной атмосферой, положу её в раздел.",
  "Интересный выбор — добавляю как вариант.",
  "Эта позиция даёт глубину подборке, добавляю.",
  "Подходит по настроению, включаю «{title}».",
  "Хорошая связка с предыдущими — добавляю.",
  "Это полезное дополнение для читателя — беру.",
  "Есть совпадения по ключевым темам — добавляю.",
  "Короткая пауза — и добавляю «{title}» в ленту.",
  "Считаю, что она поднимет релевантность — добавляю.",
  "Похожая по жанру — отлично впишется, добавляю.",
  "Добавлю её как тестовую позицию, посмотрим результаты.",
  "Она даёт нужный контраст — включаю в подборку.",
  "Подходит для основной когорты, ставлю в очередь.",
  "Книга с сильным заголовком — стоит добавить.",
  "Эта рекомендация выглядит надёжно — добавляю.",
  "Добавляю «{title}» — должно сработать с остальным.",
  "Включаю как вариант для расширения списка.",
  "С учётом тематики — логично добавить её.",
  "Добавляю, чтобы увеличить разнообразие подборки.",
];

const ACTION_TEMPLATES = [
  "Анализирую предпочтения…",
  "Собираю релевантные книги…",
  "Формирую структуру подборок…",
  "Подбираю похожие варианты…",
  "Оцениваю соответствие теме…",
  "Проверяю совпадения по жанрам…",
  "Агрегирую лучшие кандидаты…",
  "Фильтрую нерелевантные результаты…",
  "Ранжирую по релевантности…",
  "Сверяю по рейтингу и отзывам…",
  "Оптимизирую баланс жанров…",
  "Подбираю книги с похожей атмосферой…",
  "Составляю первую версию подборки…",
  "Пытаюсь учесть частые предпочтения…",
  "Собираю набор для тестирования…",
  "Прогоняю быстрый отбор по критериям…",
  "Формирую блоки по темам…",
  "Выбираю наиболее подходящие варианты…",
  "Проверяю наличие дублей…",
  "Анализирую популярность в выборке…",
  "Отсеиваю слабые совпадения…",
  "Формирую итоговую последовательность…",
  "Подстраиваю подборку под аудиторию…",
  "Подправляю порядок по смыслу…",
  "Завершаю предварительную генерацию…",
];

export function GeneratingComposer({ className }: Props) {
  const skeletonPerSection = 8;
  const totalDuration = 60000;
  const timeScale = 3;
  const titles = ["Похожее", "Что-то новое", "Выбор редакции"];
  const active = true;
  const [sections, setSections] = React.useState<
    { title: string; items: number }[]
  >([]);
  const [status, setStatus] = React.useState<string>("Запуск…");
  const runningRef = React.useRef(false);
  const restartTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    // при выключении компонента — очистить любые таймеры
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    runningRef.current = false;
    setSections([]);
    setStatus("Запуск…");

    if (!active) return;

    runningRef.current = true;

    const run = async () => {
      const start = Date.now();

      // старт: небольшая задумчивость (увеличено)
      setStatus(pick(ACTION_TEMPLATES));
      await sleep(900 * timeScale);
      if (cancelled) return;
      setStatus(pick(ACTION_TEMPLATES));
      await sleep(900 * timeScale);
      if (cancelled) return;

      // создаём секции одна за другой
      for (let si = 0; si < titles.length && !cancelled; si++) {
        const title = titles[si];

        setStatus(`Создаю раздел «${title}»…`);
        // добавляем пустую секцию
        setSections((s) => [...s, { title, items: 0 }]);
        await sleep(700 * timeScale);
        if (cancelled) break;

        // наполняем секцию по одному (длительнее — умножено на timeScale)
        for (let it = 0; it < skeletonPerSection && !cancelled; it++) {
          const elapsed = Date.now() - start;
          if (elapsed > totalDuration * timeScale) {
            // превышение времени — прерываем нормальный процесс
            cancelled = true;
            break;
          }

          setStatus(
            pick(COMMENT_TEMPLATES).replace("{title}", `книга ${it + 1}`)
          );
          setSections((prev) =>
            prev.map((sec, idx) =>
              idx === si
                ? { ...sec, items: Math.min(sec.items + 1, skeletonPerSection) }
                : sec
            )
          );

          // шаговая задержка — вариативная, увеличена
          const stepDelay = (500 + Math.floor(Math.random() * 900)) * timeScale;
          await sleep(stepDelay);
        }

        // небольшая пауза перед следующей секцией
        await sleep(600 * timeScale);
      }

      // финальная проверка: если дошли до конца без отмены
      if (!cancelled) {
        setStatus("Готово. Проверяю результат…");
        // ждём небольшую паузу — если данные не пришли и компонент всё ещё active — перезапускаем
        await sleep(1200 * timeScale);
        if (cancelled) return;

        // если компонент всё ещё active и sections присутствуют — считаем, что данных нет => ошибка -> перезапуск
        if (active) {
          setStatus("Похоже, произошла ошибка — перезапуск.");
          // короткая пауза, затем перезапуск
          await sleep(1000 * timeScale);
          if (cancelled) return;
          // сброс и рекурсивный перезапуск
          setSections([]);
          setStatus("Перезапуск…");
          // маленькая пауза перед новым циклом
          await sleep(500 * timeScale);
          if (cancelled) return;
          // рекурсивно вызвать run снова (если active всё ещё true)
          if (!cancelled && active) {
            run().catch(() => {});
            return;
          }
        }
      }
    };

    run().catch(() => {});

    return () => {
      cancelled = true;
      runningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, titles, skeletonPerSection, totalDuration, timeScale]);

  if (!active) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Верхняя карточка: слева — иконка; основной заголовок сделан "Думаю", справа — печатающийся статус */}
      <div className="rounded-xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex-1 flex gap-[12px]">
            <div className="flex items-center gap-3">
              {/* моргающее "Думаю" (без лишних слов) */}
              <div className="text-base font-semibold text-ink flex items-center justify-center w-fit">
                <TypingText text={"Думаю >"} speed={0} showCursor={true} />
              </div>
            </div>

            <div className="text-sm text-slate-600 flex items-center justify-start flex-1">
              {/* статус, печатается справа под "Думаю" */}
              <TypingText text={status} speed={20} showCursor={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Секции: только заголовки + карусели skeleton'ов; лог скрыт (не выводим) */}
      <div className="space-y-6">
        {sections.length === 0 ? (
          // начальный общий skeleton-блок
          <></>
        ) : (
          sections.map((sec) => (
            <section key={sec.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">{sec.title}</h3>
                <div className="text-xs text-slate-500">
                  {sec.items}/{skeletonPerSection}
                </div>
              </div>

              <HorizontalCarousel autoplay={false} loop={false}>
                {Array.from({ length: Math.max(1, sec.items) }).map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </HorizontalCarousel>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
