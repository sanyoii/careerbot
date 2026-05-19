import { cn } from "@/lib/utils";
import { humanizeSlug } from "@/lib/format";

/**
 * Soft, rounded-full status pill. Colour is derived from the status name so
 * the same component covers Application status, Company status, etc. Pass
 * `kind="company"` to get the company-specific palette where shared keys
 * (in-review, not-interested) differ from the application palette.
 */

const APPLICATION_PALETTE: Record<string, string> = {
  "in-review":
    "bg-amber-100/70 text-amber-800 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  applied:
    "bg-blue-100/70 text-blue-800 ring-1 ring-inset ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20",
  interview:
    "bg-violet-100/70 text-violet-800 ring-1 ring-inset ring-violet-200/70 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20",
  rejected:
    "bg-rose-100/70 text-rose-800 ring-1 ring-inset ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  offered:
    "bg-emerald-100/70 text-emerald-800 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  withdrawn:
    "bg-zinc-100/70 text-zinc-700 ring-1 ring-inset ring-zinc-200/70 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-400/20",
  "not-interested":
    "bg-stone-100/70 text-stone-700 ring-1 ring-inset ring-stone-200/70 dark:bg-stone-500/10 dark:text-stone-300 dark:ring-stone-400/20",
};

const COMPANY_PALETTE: Record<string, string> = {
  "in-review":
    "bg-zinc-100/70 text-zinc-700 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10",
  interested:
    "bg-blue-100/70 text-blue-800 ring-1 ring-inset ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20",
  "not-interested":
    "bg-rose-100/70 text-rose-800 ring-1 ring-inset ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
};

const FALLBACK =
  "bg-zinc-100/70 text-zinc-700 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10";

interface StatusBadgeProps {
  status: string | null | undefined;
  kind?: "application" | "company";
  className?: string;
}

export function StatusBadge({ status, kind, className }: StatusBadgeProps) {
  if (!status) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          FALLBACK,
          className,
        )}
      >
        —
      </span>
    );
  }
  const palette =
    (kind === "company" ? COMPANY_PALETTE[status] : APPLICATION_PALETTE[status]) ??
    FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-tight",
        palette,
        className,
      )}
    >
      {humanizeSlug(status)}
    </span>
  );
}
