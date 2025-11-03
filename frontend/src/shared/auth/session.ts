// src/shared/lib/token.ts
import { addYears } from "date-fns";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

/**
 * Ключи для хранения времени жизни токенов (timestamp ms)
 */
const ACCESS_TOKEN_EXPIRES_KEY = `${ACCESS_TOKEN}_expires`;
const REFRESH_TOKEN_EXPIRES_KEY = `${REFRESH_TOKEN}_expires`;

/**
 * Безопасный доступ к localStorage (пустая оболочка на случай SSR)
 */
function lsGet(key: string): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

function lsRemove(key: string): void {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

/**
 * Получить accessToken
 * @returns токен или null
 */
export const getAccessToken = (): string | null => {
  try {
    const accessToken = lsGet(ACCESS_TOKEN);
    // eslint-disable-next-line no-console
    return accessToken ?? null;
  } catch {
    return null;
  }
};

/**
 * Сохранение accessToken в localStorage
 * @param accessToken - сам токен
 * @param years - на сколько лет сохранять метку истечения (по умолчанию 1)
 */
export const saveTokenStorage = (accessToken: string, years = 1): void => {
  try {
    lsSet(ACCESS_TOKEN, accessToken);
    const expiresDate = addYears(new Date(), years).getTime();
    lsSet(ACCESS_TOKEN_EXPIRES_KEY, String(expiresDate));
  } catch {
    /* noop */
  }
};

/**
 * Удаление accessToken (и refreshToken тоже — removeFromStorage покрывает оба)
 */
export const removeFromStorage = (): void => {
  console.log(1212);

  try {
    lsRemove(ACCESS_TOKEN);
    lsRemove(REFRESH_TOKEN);
    lsRemove(ACCESS_TOKEN_EXPIRES_KEY);
    lsRemove(REFRESH_TOKEN_EXPIRES_KEY);
  } catch {
    /* noop */
  }
};

/**
 * Возвращает true если accessToken истёк (или отсутствует)
 */
export const isAccessTokenExpired = (): boolean => {
  try {
    const exp = lsGet(ACCESS_TOKEN_EXPIRES_KEY);
    if (!exp) return true;
    return Date.now() > Number(exp);
  } catch {
    return true;
  }
};

/**
 * ---------------------
 * Методы для refreshToken
 * ---------------------
 */

/**
 * Получить refreshToken
 */
export const getRefreshToken = (): string | null => {
  try {
    const refresh = lsGet(REFRESH_TOKEN);
    // eslint-disable-next-line no-console
    return refresh ?? null;
  } catch {
    return null;
  }
};

/**
 * Сохранение refreshToken
 */
export const saveRefreshToken = (refreshToken: string, years = 1): void => {
  try {
    lsSet(REFRESH_TOKEN, refreshToken);
    const expiresDate = addYears(new Date(), years).getTime();
    lsSet(REFRESH_TOKEN_EXPIRES_KEY, String(expiresDate));
  } catch {
    /* noop */
  }
};

/**
 * Возвращает true если refreshToken истёк (или отсутствует)
 */
export const isRefreshTokenExpired = (): boolean => {
  try {
    const exp = lsGet(REFRESH_TOKEN_EXPIRES_KEY);
    if (!exp) return true;
    return Date.now() > Number(exp);
  } catch {
    return true;
  }
};
