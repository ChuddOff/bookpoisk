let accessToken: string | null = null;

export const session = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
  isAuth(): boolean {
    return !!accessToken;
  },
};
