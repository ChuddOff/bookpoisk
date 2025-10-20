export type AuthIntent =
  | { type: "goto"; href: string }
  | { type: "like-book"; bookId: string };

const KEY = "auth-intent";

export const AuthIntentStore = {
  save(intent: AuthIntent) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(intent));
    } catch {}
  },
  take(): AuthIntent | null {
    try {
      const s = sessionStorage.getItem(KEY);
      if (!s) return null;
      sessionStorage.removeItem(KEY);
      return JSON.parse(s) as AuthIntent;
    } catch {
      return null;
    }
  },
  peek(): AuthIntent | null {
    try {
      const s = sessionStorage.getItem(KEY);
      return s ? (JSON.parse(s) as AuthIntent) : null;
    } catch {
      return null;
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  },
};
