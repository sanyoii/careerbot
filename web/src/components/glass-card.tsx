import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** When true, use the stronger glass treatment (e.g. sidenav). */
  strong?: boolean;
}

export function GlassCard({ className, strong, ...props }: GlassCardProps) {
  return (
    <div
      {...props}
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-2xl",
        className,
      )}
    />
  );
}
