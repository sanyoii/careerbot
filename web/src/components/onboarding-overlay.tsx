"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Terminal } from "lucide-react";

interface OnboardingOverlayProps {
  initiallyOpen: boolean;
}

export function OnboardingOverlay({ initiallyOpen }: OnboardingOverlayProps) {
  const [open, setOpen] = React.useState(initiallyOpen);

  if (!open) return null;

  return (
    <DialogPrimitive.Root open disablePointerDismissal onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 sm:max-w-md outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="glass-strong relative flex flex-col gap-6 rounded-3xl p-8 sm:p-10">
            <BackdropGlow />

            <div className="relative flex flex-col gap-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900/[0.04] dark:bg-white/[0.06]">
                <Terminal className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
              </div>

              <header className="space-y-2">
                <DialogPrimitive.Title className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Finish setup in your terminal
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Careerbot needs your preferences before the dashboard has anything to show. The fastest path is the CLI onboarding skill, which interviews you through every section and writes <code className="rounded bg-zinc-900/[0.04] px-1 py-0.5 font-mono text-xs dark:bg-white/[0.06]">context/preferences.md</code> for you.
                </DialogPrimitive.Description>
              </header>

              <div className="rounded-2xl border border-zinc-900/[0.06] bg-zinc-900/[0.03] p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <Step n={1}>
                    Open this repo in Claude Code (or any agent that supports skills).
                  </Step>
                  <Step n={2}>
                    Run <code className="rounded bg-zinc-900/[0.06] px-1.5 py-0.5 font-mono text-xs dark:bg-white/[0.1]">/onboard</code> and answer the prompts.
                  </Step>
                  <Step n={3}>Refresh this page when it's done.</Step>
                </ol>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function BackdropGlow() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400/25 via-indigo-400/10 to-transparent blur-3xl dark:from-violet-400/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-400/20 via-teal-400/10 to-transparent blur-3xl dark:from-emerald-400/10"
      />
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.06] text-[11px] font-medium text-zinc-700 dark:bg-white/[0.1] dark:text-zinc-200">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
