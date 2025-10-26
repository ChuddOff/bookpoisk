// src/shared/api/endpoints.ts
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
