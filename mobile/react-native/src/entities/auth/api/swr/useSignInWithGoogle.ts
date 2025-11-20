import { ENDPOINT } from "@/shared/api/endpoints";
import { env } from "@/shared/config";

export function useSignInWithGoogle() {
  const signIn = (opts?: { next?: string }) => {
    const base = env.API_URL;
    const redirectUrl = new URL(`${window.location.origin}/auth/done`);
    if (opts?.next) redirectUrl.searchParams.set("next", opts.next);
    const url =
      `${base}${ENDPOINT.auth.googleStart}` +
      `?redirect=${encodeURIComponent(redirectUrl.toString())}`;
    window.location.href = url;
  };
  return { signIn };
}
