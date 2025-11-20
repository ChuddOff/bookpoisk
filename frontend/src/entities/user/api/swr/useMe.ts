import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import { userService } from "../user.service";
import type { User } from "@/entities/user";
import { ENDPOINT } from "@/shared/api";

export function useMe(cfg?: SWRConfiguration) {
  const key = ENDPOINT.user;
  return useSWR<User>(key, () => userService.me(), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    ...cfg,
  });
}
