// src/shared/auth/session.ts
let inMemoryToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryToken;
}

export function setAccessToken(token: string | null) {
  inMemoryToken = token ?? null;
}

export function removeFromStorage() {
  inMemoryToken = null;
}
