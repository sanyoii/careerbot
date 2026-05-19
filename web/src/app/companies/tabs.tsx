"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/glass-card";
import { StatusSelect } from "@/components/status-select";
import { COMPANY_STATUSES, type Company } from "@/lib/types";
import { humanizeSlug } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTabIndicator } from "@/lib/use-tab-indicator";

const SELECTED_ROW_CLASS =
  "bg-white/90 ring-1 ring-zinc-900/5 dark:bg-white/[0.08] dark:ring-white/10";

type TabSpec = { value: string; label: string };

const TABS: TabSpec[] = [
  { value: "all", label: "All" },
  ...COMPANY_STATUSES.map((s) => ({
    value: s,
    label: humanizeSlug(s),
  })),
];

export function CompaniesTabs({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");
  const [active, setActive] = React.useState("all");
  const { listRef, setTriggerRef, indicator, firstPaint } = useTabIndicator(active);

  // When the panel is open, swapping tabs should auto-select the first row of
  // the new tab. If the currently-selected row already belongs to the new tab,
  // keep it. If the new tab has no rows, push a sentinel so the panel stays
  // open and renders an empty state.
  React.useEffect(() => {
    if (!selectedId) return;
    const rows =
      active === "all"
        ? companies
        : companies.filter((c) => c.status === active);
    if (rows.some((r) => r.id === selectedId)) return;
    const next = rows[0]?.id ?? "__empty__";
    if (next === selectedId) return;
    router.replace(`${pathname}?selected=${encodeURIComponent(next)}`);
  }, [active, selectedId, companies, router, pathname]);

  const counts = new Map<string, number>();
  counts.set("all", companies.length);
  for (const status of COMPANY_STATUSES) counts.set(status, 0);
  for (const company of companies) {
    if (company.status && counts.has(company.status)) {
      counts.set(company.status, counts.get(company.status)! + 1);
    }
  }

  // Preserve any existing search params (e.g. `selected`) when linking to a row.
  const rowHref = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    return `/companies?${params.toString()}`;
  };

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v ?? "all")} className="flex h-full flex-col gap-0">
      <div className="shrink-0 border-b border-zinc-200/70 dark:border-white/10">
        <TabsList
          ref={listRef}
          className="relative flex w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent p-0 group-data-horizontal/tabs:h-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {indicator ? (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute -bottom-px left-0 z-10 h-[2.5px] rounded-full bg-zinc-900 dark:bg-white",
                firstPaint ? "" : "transition-all duration-300 ease-out",
              )}
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
            />
          ) : null}

          {TABS.map((tab) => {
            const count = counts.get(tab.value) ?? 0;
            const isActive = active === tab.value;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                ref={setTriggerRef(tab.value)}
                className={cn(
                  "relative z-10 h-10 shrink-0 bg-transparent px-4 text-sm transition-colors",
                  "before:absolute before:inset-x-0 before:top-1 before:bottom-1.5 before:rounded-md before:transition-colors before:content-['']",
                  "data-active:bg-transparent data-active:border-transparent data-active:shadow-none dark:data-active:bg-transparent dark:data-active:border-transparent",
                  isActive
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 hover:before:bg-zinc-100/60 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:before:bg-white/[0.04]",
                )}
              >
                <span className={isActive ? "font-medium" : ""}>{tab.label}</span>
                <span className="ml-1 text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {TABS.map((tab) => {
        const rows =
          tab.value === "all"
            ? companies
            : companies.filter((c) => c.status === tab.value);
        return (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="flex-1 overflow-y-auto pt-4 pb-8"
          >
            {rows.length === 0 ? (
              <GlassCard className="p-10 text-center text-sm text-zinc-500">
                No companies in this status.
              </GlassCard>
            ) : (
              <GlassCard className="overflow-hidden">
                <ul className="divide-y divide-zinc-200/60 dark:divide-white/10">
                  {rows.map((company) => (
                    <li key={company.id}>
                      <Link
                        href={rowHref(company.id)}
                        className={cn(
                          "group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-zinc-900/[0.025] dark:hover:bg-white/[0.03]",
                          company.id === selectedId && SELECTED_ROW_CLASS,
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                              {company.name}
                            </span>
                            {company.industry.slice(0, 3).map((tag) => (
                              <IndustryChip key={tag} tag={tag} />
                            ))}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                            {company.hq ? <span>{company.hq}</span> : null}
                            {company.remotePolicy ? (
                              <span>{humanizeSlug(company.remotePolicy)}</span>
                            ) : null}
                          </div>
                        </div>
                        <StatusSelect
                          kind="company"
                          id={company.id}
                          status={company.status}
                        />
                        <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-zinc-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function IndustryChip({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10">
      {tag}
    </span>
  );
}
