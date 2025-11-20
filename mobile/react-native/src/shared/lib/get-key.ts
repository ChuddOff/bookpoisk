export function getKey<T extends string, G extends Record<string, any>>(
  url: T,
  params?: G
): `${T}${string}` {
  if (!params) {
    return `${url}`;
  }

  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== null && value !== undefined && !!value
    )
  );

  const sp = new URLSearchParams(filteredParams);
  return `${url}${sp ? "?" + sp.toString() : ""}`;
}
