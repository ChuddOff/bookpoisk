import * as React from "react";
import { useSWRConfig } from "swr";
import { apiService } from "@/shared/api/http.service";
import { ENDPOINT } from "@/shared/api/endpoints";
import { session } from "@/shared/auth/session";
import { useMe } from "@/entities/user";

export function useFinishLogin() {
  const { mutate } = useSWRConfig();
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);
  const { mutate: mutateMe } = useMe();

  const finishLogin = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { access } = await apiService.post<{ access: string }>(
        ENDPOINT.auth.refresh
      );
      session.set(access);
      await mutateMe();
    } catch (e) {
      session.clear();
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [mutate]);

  return { finishLogin, isLoading, error };
}
