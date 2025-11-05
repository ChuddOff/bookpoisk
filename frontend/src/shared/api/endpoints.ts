export const ENDPOINT = {
  login: "/login",
  register: "/register",
  user: "/auth/me",
  book: "/book",
  books: "/books",
  bookForMe: "/bookForMe",
  likedBooks: "/likedBooks",
  likeBook: "/likeBook",
  unlikeBook: "/unlikeBook",
  genres: "/genres",
  auth: {
    googleStart: "/oauth2/authorization/google",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
} as const;
