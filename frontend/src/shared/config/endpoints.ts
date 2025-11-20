// src/shared/api/endpoints.ts

export type AuthEndpoints = {
  login: string;
  register: string;
  googleStart: string;
  callback: string;
  refresh: string;
  logout: string;
};

export const ENDPOINT = {
  login: "/login",
  register: "/register",
  user: "/user",
  book: "/book",
  bookForMe: "/bookForMe",
  likeBook: "/likeBook",
  auth: {
    googleStart: "/oauth2/authorization/google",
    callback: "/auth/google/callback",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
} as const;
