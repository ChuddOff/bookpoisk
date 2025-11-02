import * as React from "react";
import { useSWRConfig } from "swr";
import { useMe } from "@/entities/user";
import { authService } from "@/shared";

export function useFinishLogin() {
  const { mutate } = useSWRConfig();
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);
  const { mutate: mutateMe } = useMe();

  const finishLogin = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.refresh();
      await mutateMe();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [mutate]);

  return { finishLogin, isLoading, error };
}
