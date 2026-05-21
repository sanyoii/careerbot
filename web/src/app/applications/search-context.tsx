"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Ctx {
  query: string;
  setQuery: (q: string) => void;
}

const SearchCtx = React.createContext<Ctx | null>(null);

export function ApplicationsSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  return (
    <SearchCtx.Provider value={{ query, setQuery }}>{children}</SearchCtx.Provider>
  );
}

export function useApplicationsSearch() {
  return React.useContext(SearchCtx);
}

export function ApplicationsSearchInput() {
  const ctx = useApplicationsSearch();
  if (!ctx) return null;
  return (
    <div className="relative w-56">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
      <Input
        type="search"
        value={ctx.query}
        onChange={(e) => ctx.setQuery(e.currentTarget.value)}
        placeholder="Search applications…"
        className="pl-7"
        aria-label="Search applications"
      />
    </div>
  );
}
