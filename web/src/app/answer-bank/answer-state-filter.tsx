"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabIndicator } from "@/lib/use-tab-indicator";
import { cn } from "@/lib/utils";

const FILTER_VALUES = ["all", "unanswered", "answered"] as const;
export type AnsweredFilter = (typeof FILTER_VALUES)[number];

const LABELS: Record<AnsweredFilter, string> = {
  all: "All",
  unanswered: "Unanswered",
  answered: "Answered",
};

export function parseAnsweredFilter(value: string | null | undefined): AnsweredFilter {
  return (FILTER_VALUES as readonly string[]).includes(value ?? "")
    ? (value as AnsweredFilter)
    : "all";
}

export function AnswerStateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = parseAnsweredFilter(searchParams.get("answered"));
  // Local state drives the animation immediately on click. The URL is the
  // source of truth for the rest of the page, but waiting for the router round
  // trip before re-rendering makes the sliding indicator jump.
  const [active, setActive] = React.useState<AnsweredFilter>(urlValue);
  const lastSyncedRef = React.useRef(urlValue);
  React.useEffect(() => {
    if (urlValue !== lastSyncedRef.current) {
      lastSyncedRef.current = urlValue;
      setActive(urlValue);
    }
  }, [urlValue]);

  const { listRef, setTriggerRef, indicator, firstPaint } = useTabIndicator(active);

  const onChange = (value: string | undefined) => {
    const next = parseAnsweredFilter(value);
    setActive(next);
    lastSyncedRef.current = next;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("answered");
    } else {
      params.set("answered", next);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <Tabs value={active} onValueChange={onChange} className="gap-0">
      <TabsList
        ref={listRef}
        className="relative h-8 bg-zinc-100/70 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/[0.04] dark:ring-white/10"
      >
        {indicator ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-[3px] bottom-[3px] left-0 z-0 rounded-md bg-white dark:bg-white/10",
              firstPaint ? "" : "transition-all duration-300 ease-out",
            )}
            style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          />
        ) : null}
        {FILTER_VALUES.map((v) => (
          <TabsTrigger
            key={v}
            value={v}
            ref={setTriggerRef(v)}
            className="relative z-10 px-3 text-xs text-zinc-500 hover:text-zinc-900 data-active:bg-transparent data-active:text-zinc-900 data-active:shadow-none dark:text-zinc-400 dark:hover:text-zinc-50 dark:data-active:bg-transparent dark:data-active:text-zinc-50 dark:data-active:border-transparent"
          >
            {LABELS[v]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
