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
    googleStart: "/oauth2/authorization/google",
    refresh: "/auth/info",
    logout: "/auth/logout",
  },
} as const;
