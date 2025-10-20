export const ENDPOINT = {
  login: "/login",
  register: "/register",
  user: "/user",
  book: "/book",
  books: "/books",
  bookForMe: "/bookForMe",
  likeBook: "/likeBook",
  genres: "/genres",
  auth: {
    googleStart: "/auth/google/start",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
} as const;
