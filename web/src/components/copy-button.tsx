"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Small icon button that copies `text` to the clipboard and shows a green
 * checkmark for ~1.5s. Stops event propagation so it can sit safely inside
 * a clickable container (e.g. a list row that's wrapped in a Link).
 */
export function CopyButton({ text, className, ariaLabel }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleClick = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        // clipboard may be unavailable in insecure contexts — silent no-op
      }
    },
    [text],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      title={copied ? "Copied!" : "Copy"}
      aria-label={ariaLabel ?? `Copy ${text}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
        "text-zinc-500 hover:bg-zinc-900/10 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-50",
        copied && "text-emerald-600 dark:text-emerald-400",
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
