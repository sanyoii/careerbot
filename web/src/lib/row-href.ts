/**
 * Build the link target for a list-row → detail-sheet selection. Preserves
 * any other URL search params (filter, search, etc.) and replaces just
 * `selected=<id>`. Shared by the applications, companies, and answer-bank
 * tabs so a new query param added to one page doesn't get clobbered by the
 * others.
 */
export function rowHref(
  pathname: string,
  id: string,
  currentParams: URLSearchParams | ReadonlyURLSearchParamsLike,
): string {
  const params = new URLSearchParams(currentParams.toString());
  params.set("selected", id);
  return `${pathname}?${params.toString()}`;
}

interface ReadonlyURLSearchParamsLike {
  toString(): string;
}
