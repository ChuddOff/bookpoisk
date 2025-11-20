// src/shared/lib/query.ts
export type Query = Record<
  string,
  string | number | boolean | string[] | number[] | undefined
>;

export function toQueryString(q?: Query) {
  if (!q) return "";
  const s = new URLSearchParams();
  Object.entries(q).forEach(([key, val]) => {
    if (val === undefined) return;
    if (Array.isArray(val)) {
      val.forEach((v) => s.append(key, String(v)));
    } else {
      s.set(key, String(val));
    }
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}
