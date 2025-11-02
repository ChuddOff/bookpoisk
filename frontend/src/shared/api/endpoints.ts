export const ENDPOINT = {
  login: "/login",
  register: "/register",
  user: "/auth/me/google",
  book: "/book",
  books: "/books",
  bookForMe: "/bookForMe",
  likeBook: "/likeBook",
  genres: "/genres",
  auth: {
    googleStart: "/oauth2/authorization/google",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
} as const;
