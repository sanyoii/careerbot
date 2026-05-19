"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { humanizeSlug } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPLICATION_STATUSES,
  COMPANY_STATUSES,
  type ApplicationStatus,
  type CompanyStatus,
} from "@/lib/types";
import { updateApplication } from "@/app/applications/[id]/actions";
import { updateCompanyStatus } from "@/app/companies/[id]/actions";

const APPLICATION_PALETTE: Record<ApplicationStatus, string> = {
  "in-review":
    "bg-amber-100/70 text-amber-800 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  applied:
    "bg-blue-100/70 text-blue-800 ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20",
  interview:
    "bg-violet-100/70 text-violet-800 ring-violet-200/70 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20",
  rejected:
    "bg-rose-100/70 text-rose-800 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  offered:
    "bg-emerald-100/70 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  withdrawn:
    "bg-zinc-100/70 text-zinc-700 ring-zinc-200/70 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-400/20",
  "not-interested":
    "bg-stone-100/70 text-stone-700 ring-stone-200/70 dark:bg-stone-500/10 dark:text-stone-300 dark:ring-stone-400/20",
};

const COMPANY_PALETTE: Record<CompanyStatus, string> = {
  "in-review":
    "bg-zinc-100/70 text-zinc-700 ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10",
  interested:
    "bg-blue-100/70 text-blue-800 ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20",
  "not-interested":
    "bg-rose-100/70 text-rose-800 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
};

const FALLBACK =
  "bg-zinc-100/70 text-zinc-700 ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10";

type StatusSelectProps =
  | { kind: "application"; id: string; status: ApplicationStatus | null }
  | { kind: "company"; id: string; status: CompanyStatus | null };

/**
 * Inline status pill that doubles as a status-changer. Click opens a dropdown
 * of valid statuses for the given entity; picking one calls the matching
 * server action and surfaces a toast. The trigger swallows click +
 * pointer-down events so a wrapping row <Link> doesn't navigate.
 */
export function StatusSelect(props: StatusSelectProps) {
  const router = useRouter();
  const [value, setValue] = React.useState<string>(props.status ?? "");
  const [, startTransition] = React.useTransition();

  const options = props.kind === "company" ? COMPANY_STATUSES : APPLICATION_STATUSES;
  const paletteMap =
    props.kind === "company" ? COMPANY_PALETTE : APPLICATION_PALETTE;
  const palette =
    (value && (paletteMap as Record<string, string>)[value]) || FALLBACK;

  const handleChange = (next: string | null) => {
    if (!next) return;
    const prev = value;
    setValue(next);
    startTransition(async () => {
      try {
        if (props.kind === "application") {
          await updateApplication(props.id, { status: next as ApplicationStatus });
        } else {
          await updateCompanyStatus(props.id, next as CompanyStatus);
        }
        toast.success(`Status changed to ${humanizeSlug(next)}`);
        // Server action already calls revalidatePath; router.refresh() makes
        // the client actually re-fetch so tab counts update without reload.
        router.refresh();
      } catch (err) {
        toast.error("Failed to update status", {
          description: (err as Error).message,
        });
        setValue(prev);
      }
    });
  };

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="inline-flex"
    >
      <Select value={value || undefined} onValueChange={handleChange}>
        <SelectTrigger
          className={cn(
            "inline-flex h-auto min-h-0 items-center gap-1 rounded-full border-0 px-2.5 py-0.5 text-xs font-medium tracking-tight ring-1 ring-inset shadow-none outline-none",
            palette,
            "[&>svg]:size-3 [&>svg]:opacity-70",
          )}
        >
          <SelectValue placeholder="—">
            {value ? humanizeSlug(value) : "—"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent side="bottom" align="end" alignItemWithTrigger={false}>
          {options.map((s) => (
            <SelectItem key={s} value={s}>
              {humanizeSlug(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}
