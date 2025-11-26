import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/api/authService";
import { userService } from "@/api/userService";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/storage/tokens";
import type { UserEntity } from "@/types/user";
import { ENDPOINT } from "@/api/endpoints";
import axios from "axios";
import { getBaseUrl, loadPersistedTokens, setAuthTokens, setTokensFromAuth } from "@/api/http";

interface AuthContextShape {
  user: UserEntity | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await loadPersistedTokens();
      setAuthTokens({ access: await getAccessToken(), refresh: await getRefreshToken() });
      await fetchProfile();
      setLoading(false);
    })();
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await userService.me();
      setUser(profile);
    } catch (e) {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const resp = await authService.login(email, password);
    const access = resp.access ?? resp.accessToken ?? null;
    const refreshToken = resp.refresh ?? resp.refreshToken ?? null;
    setTokensFromAuth(access, refreshToken);
    await saveTokens(access ?? undefined, refreshToken ?? undefined);
    await fetchProfile();
  };

  const logout = async () => {
    setUser(null);
    setTokensFromAuth(null, null);
    await clearTokens();
  };

  const refresh = async () => {
    const storedRefresh = await getRefreshToken();
    if (!storedRefresh) {
      await logout();
      return;
    }
    try {
      const client = axios.create({
        baseURL: getBaseUrl(),
        headers: { Authorization: `Bearer ${storedRefresh}` }
      });
      const resp = await client.post(ENDPOINT.auth.refresh);
      const data: any = resp.data ?? {};
      const newAccess = data.access ?? data.accessToken ?? null;
      const newRefresh = data.refresh ?? data.refreshToken ?? storedRefresh;
      setTokensFromAuth(newAccess, newRefresh);
      await saveTokens(newAccess ?? undefined, newRefresh ?? undefined);
    } catch (e) {
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
