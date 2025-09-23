import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import { userService } from "../user.service";
import type { User } from "../../model/types";

export function useMe(cfg?: SWRConfiguration) {
  const key = ["me"] as const;
  return useSWR<User>(key, () => userService.me(), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    ...cfg,
  });
}
