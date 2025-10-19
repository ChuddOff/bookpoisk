import * as React from "react";
import { useSWRConfig } from "swr";
import { apiService } from "@/shared/api/http.service";
import { ENDPOINT } from "@/shared/api/endpoints";
import { session } from "@/shared/auth/session";

export function useLogout() {
  const { mutate } = useSWRConfig();
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const logout = React.useCallback(
    async (opts?: { redirectTo?: string | false }) => {
      const redirectTo = opts?.redirectTo ?? "/";
      setLoading(true);
      setError(null);
      try {
        await apiService.post(ENDPOINT.auth.logout);
      } catch (e) {
        setError(e);
      } finally {
        session.clear();
        await mutate(ENDPOINT.user, null, { revalidate: false });
        setLoading(false);
        if (redirectTo !== false) window.location.assign(redirectTo);
      }
    },
    [mutate]
  );

  return { logout, isLoading, error };
}
