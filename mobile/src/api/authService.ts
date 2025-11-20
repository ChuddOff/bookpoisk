import type { AuthResponse } from "@/types/auth";
import { ENDPOINT } from "./endpoints";
import { http, setTokensFromAuth } from "./http";

export class AuthService {
  async login(email: string, password: string) {
    const res = await http.post<AuthResponse>(ENDPOINT.login, { email, password });
    const data = res.data ?? {};
    const access = data.access ?? data.accessToken ?? null;
    const refresh = data.refresh ?? data.refreshToken ?? null;
    setTokensFromAuth(access, refresh);
    return data;
  }

  async register(email: string, password: string, name?: string) {
    const res = await http.post<AuthResponse>(ENDPOINT.register, { email, password, name });
    const data = res.data ?? {};
    const access = data.access ?? data.accessToken ?? null;
    const refresh = data.refresh ?? data.refreshToken ?? null;
    setTokensFromAuth(access, refresh);
    return data;
  }
}

export const authService = new AuthService();
