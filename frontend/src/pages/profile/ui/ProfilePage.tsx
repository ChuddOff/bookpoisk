// src/pages/profile/ui/ProfilePage.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Container, Button } from "@/shared/ui"; // подкорректируй пути, если у тебя иначе
import { useMe } from "@/entities/user";
import {
  useBooksForMe,
  BookRowCard,
  BookRowCardSkeleton,
} from "@/entities/book";
import type { SWRConfiguration } from "swr";
import { useLogout } from "@/features/auth/hooks/useLogout";

/**
 * Профиль пользователя.
 *
 * Левая колонка (фиксированная ширина): аватар (круг), имя, email, кнопки.
 * Правая колонка (растёт): список лайкнутых книг (BookRowCard).
 */
export function ProfilePage(): React.JSX.Element {
  const logout = useLogout();
  const nav = useNavigate();

  // профиль пользователя
  const { data: meResp, isLoading: meLoading } = useMe();
  // Подстраховка — разные проекты по-разному возвращают user -> поэтому используем meResp?.data || meResp
  const me = (meResp as any)?.data ?? meResp;

  // лайкнутые книги
  const {
    data: booksResp,
    isLoading: booksLoading,
    error,
  } = useBooksForMe(
    { page: 1, per_page: 20 } as any /* ForMeParams */,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    } as SWRConfiguration
  );

  // Уебедимся в форматах (у тебя везде приходило { data: { data: Book[] ... } })
  const items =
    (booksResp as any)?.data?.data ??
    (booksResp as any)?.data ??
    (booksResp as any) ??
    [];

  return (
    <Container className="py-8">
      <div className="min-h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 tablet:grid-cols-[320px_1fr] gap-6">
          {/* left column */}
          <aside className="rounded-xl border border-line bg-white p-6 flex flex-col items-center gap-4 h-fit">
            <div className="w-64 h-64 rounded-full overflow-hidden bg-soft flex items-center justify-center">
              {me?.avatar ? (
                <img
                  src={me.avatar}
                  alt={me?.name ?? me?.login ?? "avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-400">Нет аватарки</div>
              )}
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-ink">
                {meLoading
                  ? "Загрузка..."
                  : me?.name ?? me?.login ?? "Пользователь"}
              </div>
              {me?.email && (
                <div className="text-sm text-slate-500 mt-1">{me.email}</div>
              )}
            </div>

            <div className="w-full mt-3 flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                }}
                className="w-full"
              >
                Выйти
              </Button>
            </div>
          </aside>

          {/* right column */}
          <main className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Избранные книги</h2>
              <div className="text-sm text-slate-500">
                {booksLoading ? "Загрузка..." : `${items.length ?? 0} шт.`}
              </div>
            </div>

            {booksLoading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <BookRowCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!booksLoading && error && (
              <div className="rounded-xl border border-line bg-white p-4 text-sm text-red-600">
                Не удалось загрузить избранное. Попробуйте обновить.
              </div>
            )}

            {!booksLoading && !error && (!items || items.length === 0) && (
              <div className="rounded-xl border border-line bg-white p-4 text-sm text-slate-600">
                У вас пока нет отмеченных книг.
              </div>
            )}

            {!booksLoading && items && items.length > 0 && (
              <div className="flex flex-col gap-3">
                {items.map((b: any) => (
                  <BookRowCard
                    key={b.id}
                    book={b}
                    onNavigate={() => nav(`/book/${b.id}`)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </Container>
  );
}
