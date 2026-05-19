export function enumOrUndefined<T extends string>(
  v: T | null | undefined,
  allowed: readonly T[],
): T | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  return allowed.includes(v) ? v : undefined;
}
