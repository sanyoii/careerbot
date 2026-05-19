import { cn } from "@/lib/utils";
import { humanizeSlug } from "@/lib/format";
import {
  APPLICATION_PALETTE,
  COMPANY_PALETTE,
  STATUS_FALLBACK,
} from "@/lib/status-palette";

interface StatusBadgeProps {
  status: string | null | undefined;
  kind?: "application" | "company";
  className?: string;
}

export function StatusBadge({ status, kind, className }: StatusBadgeProps) {
  const palette =
    (status &&
      (kind === "company"
        ? (COMPANY_PALETTE as Record<string, string>)[status]
        : (APPLICATION_PALETTE as Record<string, string>)[status])) ||
    STATUS_FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-tight ring-1 ring-inset",
        palette,
        className,
      )}
    >
      {status ? humanizeSlug(status) : "—"}
    </span>
  );
}
