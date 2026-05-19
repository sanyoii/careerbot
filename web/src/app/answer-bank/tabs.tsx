"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/glass-card";
import {
  ANSWER_THEMES,
  type AnswerBankEntry,
  type AnswerTheme,
} from "@/lib/types";
import { formatDate, humanizeSlug } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTabIndicator } from "@/lib/use-tab-indicator";
import { useUnsavedChanges } from "@/components/unsaved-changes";
import {
  parseAnsweredFilter,
  type AnsweredFilter,
} from "./answer-state-filter";

const SELECTED_ROW_CLASS =
  "bg-white/90 ring-1 ring-zinc-900/5 dark:bg-white/[0.08] dark:ring-white/10";

type TabValue = "all" | AnswerTheme;
type TabSpec = { value: TabValue; label: string };

const TABS: TabSpec[] = [
  { value: "all", label: "All" },
  ...ANSWER_THEMES.map((t) => ({ value: t, label: humanizeSlug(t) })),
];

function rowsFor(
  tab: TabValue,
  answered: AnsweredFilter,
  entries: AnswerBankEntry[],
): AnswerBankEntry[] {
  const byTheme = tab === "all" ? entries : entries.filter((e) => e.theme === tab);
  if (answered === "all") return byTheme;
  if (answered === "unanswered") return byTheme.filter((e) => e.canonicalAnswer === null);
  return byTheme.filter((e) => e.canonicalAnswer !== null);
}

export function AnswerBankTabs({ entries }: { entries: AnswerBankEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");
  const answered = parseAnsweredFilter(searchParams.get("answered"));
  const [active, setActive] = React.useState<TabValue>("all");
  const { listRef, setTriggerRef, indicator, firstPaint } = useTabIndicator(active);

  // When the panel is open, swapping tabs (or changing the answered filter)
  // should auto-select the first row of the new view. If the currently-selected
  // row already belongs to the new view, keep it. If the new view has no rows,
  // push a sentinel so the panel stays open and renders an empty state.
  React.useEffect(() => {
    if (!selectedId) return;
    const rows = rowsFor(active, answered, entries);
    if (rows.some((r) => r.id === selectedId)) return;
    const next = rows[0]?.id ?? "__empty__";
    if (next === selectedId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", next);
    router.replace(`${pathname}?${params.toString()}`);
  }, [active, answered, selectedId, entries, router, pathname, searchParams]);

  const counts = new Map<TabValue, number>(
    TABS.map((tab) => [tab.value, rowsFor(tab.value, answered, entries).length]),
  );

  const rowHref = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    return `/answer-bank?${params.toString()}`;
  };

  // When the editor has unsaved changes, navigating to another row should
  // warn first. We synchronously preventDefault, then defer the actual
  // router.push to after the user confirms.
  const { dirty, confirmDiscard } = useUnsavedChanges();
  const onRowClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!dirty) return;
    e.preventDefault();
    confirmDiscard().then((ok) => {
      if (ok) router.push(href);
    });
  };

  return (
    <Tabs
      value={active}
      onValueChange={(v) => {
        const next = TABS.find((t) => t.value === v)?.value ?? "all";
        setActive(next);
      }}
      className="flex h-full flex-col gap-0"
    >
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
        const rows = rowsFor(tab.value, answered, entries);
        return (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="flex-1 overflow-y-auto pt-4 pb-8"
          >
            {rows.length === 0 ? (
              <GlassCard className="p-10 text-center text-sm text-zinc-500">
                {answered === "unanswered" ? (
                  <>
                    Nothing unanswered here. Run <code className="font-mono text-xs">/find-roles</code> in Claude Code to generate new questions as you apply to roles.
                  </>
                ) : answered === "answered" ? (
                  <>
                    Nothing answered here yet. Run <code className="font-mono text-xs">/seed-answer-bank</code> in Claude Code to fill in stubs.
                  </>
                ) : (
                  <>
                    No entries in this category yet. Run <code className="font-mono text-xs">/seed-answer-bank</code> in Claude Code to fill it in.
                  </>
                )}
              </GlassCard>
            ) : (
              <GlassCard className="overflow-hidden">
                <ul className="divide-y divide-zinc-200/60 dark:divide-white/10">
                  {rows.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={rowHref(entry.id)}
                        onClick={(e) => onRowClick(e, rowHref(entry.id))}
                        className={cn(
                          "group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-zinc-900/[0.025] dark:hover:bg-white/[0.03]",
                          entry.id === selectedId && SELECTED_ROW_CLASS,
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                            {entry.question}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {answered === "all" && entry.canonicalAnswer === null ? (
                              <UnansweredChip />
                            ) : null}
                            {tab.value === "all" && entry.theme ? (
                              <ThemeChip theme={entry.theme} />
                            ) : null}
                            {entry.tags.slice(0, 6).map((tag) => (
                              <TagChip key={tag} tag={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="hidden text-right text-xs text-zinc-500 sm:block">
                          {entry.lastUpdated ? (
                            <>
                              <div>Updated</div>
                              <div className="text-zinc-700 dark:text-zinc-300">
                                {formatDate(entry.lastUpdated)}
                              </div>
                            </>
                          ) : null}
                        </div>
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

function TagChip({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10">
      {tag}
    </span>
  );
}

function UnansweredChip() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100/70 px-2 py-0.5 text-[10px] font-medium tracking-tight text-amber-800 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
      Unanswered
    </span>
  );
}

function ThemeChip({ theme }: { theme: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-900/[0.04] px-2 py-0.5 text-[10px] font-medium tracking-tight text-zinc-700 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10">
      {humanizeSlug(theme)}
    </span>
  );
}
