// src/shared/lib/token.ts
import { addYears } from "date-fns";
import Cookies from "js-cookie";
import { ACCESS_TOKEN } from "../constants";

/**
 * Получить accessToken
 * @returns токен или null
 */
export const getAccessToken = (): string | null => {
  const accessToken = Cookies.get(ACCESS_TOKEN);
  console.log(document.cookie);

  console.log(accessToken);

  return accessToken ?? null;
};

/**
 * Сохранение токена в куку
 * @param accessToken - токен
 * @param years - на сколько лет сохранять (по умолчанию 1)
 */
export const saveTokenStorage = (accessToken: string, years = 1): void => {
  Cookies.set(ACCESS_TOKEN, accessToken, {
    sameSite: "Strict",
    // addYears вернёт дату через `years` лет
    expires: addYears(new Date(), years),
    // path можно указать явно, если нужно
    path: "/",
    // secure включаем в проде; для dev на http можно не ставить
    // secure: process.env.NODE_ENV === "production",
  });
};

/**
 * Удаление токена
 */
export const removeFromStorage = (): void => {
  Cookies.remove(ACCESS_TOKEN, { path: "/" });
};
