"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { humanizeSlug } from "@/lib/format";

interface StatusAction<T extends string> {
  label: string;
  status: T;
  variant?: "default" | "outline";
}

interface StatusActionBarProps<T extends string> {
  actions: StatusAction<T>[];
  update: (status: T) => Promise<void>;
  /** When provided, the success toast includes an Undo action that reverts
   *  back to this status. */
  previousStatus?: T | null;
}

export function StatusActionBar<T extends string>({
  actions,
  update,
  previousStatus,
}: StatusActionBarProps<T>) {
  const router = useRouter();
  const [pending, setPending] = React.useState<T | null>(null);

  const handle = (status: T) => {
    setPending(status);
    (async () => {
      try {
        await update(status);
        toast.success(
          `Status changed to ${humanizeSlug(status)}`,
          previousStatus
            ? {
                action: {
                  label: "Undo",
                  onClick: async () => {
                    try {
                      await update(previousStatus);
                      toast.success(
                        `Reverted to ${humanizeSlug(previousStatus)}`,
                      );
                      router.refresh();
                    } catch (err) {
                      toast.error("Failed to undo status change", {
                        description: (err as Error).message,
                      });
                    }
                  },
                },
              }
            : undefined,
        );
        router.refresh();
      } catch (err) {
        toast.error("Failed to update status", {
          description: (err as Error).message,
        });
      } finally {
        setPending(null);
      }
    })();
  };

  return (
    <div className="absolute right-0 bottom-0 left-0 z-10 flex gap-2 border-t border-zinc-200/60 bg-white px-5 py-3 dark:border-white/10 dark:bg-zinc-950">
      {actions.map(({ label, status, variant }) => (
        <Button
          key={status}
          variant={variant ?? "default"}
          className="flex-1"
          disabled={pending !== null}
          onClick={() => handle(status)}
        >
          {pending === status ? "Saving…" : label}
        </Button>
      ))}
    </div>
  );
}
