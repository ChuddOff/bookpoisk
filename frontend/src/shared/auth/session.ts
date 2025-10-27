// src/shared/auth/session.ts
class SessionStore {
  private accessToken: string | null = null;

  get(): string | null {
    return this.accessToken;
  }

  set(token: string | null): void {
    this.accessToken = token ?? null;
  }

  clear(): void {
    this.accessToken = null;
  }

  isAuth(): boolean {
    return this.accessToken !== null;
  }
}

export const session = new SessionStore();

export function getAccessToken(): string | null {
  return session.get();
}

export function setAccessToken(token: string | null): void {
  session.set(token);
}

export function clearAccessToken(): void {
  session.clear();
}

export function removeFromStorage(): void {
  session.clear();
}
