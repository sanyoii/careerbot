import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlassCard } from "./glass-card";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

export type EmptyStateStep =
  | {
      kind: "command";
      command: string;
      icon: React.ReactNode;
      description: string;
    }
  | {
      kind: "link";
      href: string;
      label: string;
      icon: React.ReactNode;
      description: string;
    };

interface EmptyStateCardProps {
  title: string;
  description: string;
  steps: EmptyStateStep[];
}

export function EmptyStateCard({ title, description, steps }: EmptyStateCardProps) {
  const numbered = steps.length > 1;
  return (
    <GlassCard className="relative overflow-hidden p-10 sm:p-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400/20 via-indigo-400/10 to-transparent blur-3xl dark:from-violet-400/10 dark:via-indigo-400/[0.06]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-400/10 to-transparent blur-3xl dark:from-emerald-400/8 dark:via-teal-400/[0.05]"
      />

      <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>

        <ol className="mt-7 w-full max-w-md space-y-3">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div className="flex justify-center">
                  <ArrowRight className="h-3.5 w-3.5 rotate-90 text-zinc-400 dark:text-zinc-600" />
                </div>
              ) : null}
              <StepRow step={step} index={numbered ? i + 1 : null} />
            </React.Fragment>
          ))}
        </ol>
      </div>
    </GlassCard>
  );
}

function StepRow({ step, index }: { step: EmptyStateStep; index: number | null }) {
  const numberBadge =
    index != null ? (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-[11px] font-semibold tabular-nums text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
        {index}
      </span>
    ) : null;

  const iconBadge = (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 text-violet-700 dark:text-violet-300">
      {step.icon}
    </span>
  );

  if (step.kind === "link") {
    return (
      <li>
        <Link
          href={step.href}
          className={cn(
            chipShellClass,
            "group transition-colors hover:bg-white/80 dark:hover:bg-white/[0.07]",
          )}
        >
          {numberBadge}
          {iconBadge}
          <div className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {step.label}
            </span>
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
              {step.description}
            </p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-zinc-500" />
        </Link>
      </li>
    );
  }

  return (
    <li className={chipShellClass}>
      {numberBadge}
      {iconBadge}
      <div className="min-w-0 flex-1 text-left">
        <code className="block truncate font-mono text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {step.command}
        </code>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
          {step.description}
        </p>
      </div>
      <CopyButton text={step.command} ariaLabel={`Copy ${step.command}`} />
    </li>
  );
}

const chipShellClass = cn(
  "flex items-center gap-3 rounded-xl border border-zinc-900/5 bg-white/60 px-3 py-2.5 backdrop-blur-sm",
  "dark:border-white/10 dark:bg-white/[0.04]",
);
