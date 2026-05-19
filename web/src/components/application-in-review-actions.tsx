"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { humanizeSlug } from "@/lib/format";
import { type ApplicationStatus } from "@/lib/types";
import { updateApplication } from "@/app/applications/[id]/actions";

interface ApplicationInReviewActionsProps {
  applicationId: string;
}

export function ApplicationInReviewActions({
  applicationId,
}: ApplicationInReviewActionsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState<ApplicationStatus | null>(null);

  const handle = (status: ApplicationStatus) => {
    setPending(status);
    (async () => {
      try {
        await updateApplication(applicationId, { status });
        toast.success(`Status changed to ${humanizeSlug(status)}`);
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
      <Button
        variant="outline"
        className="flex-1"
        disabled={pending !== null}
        onClick={() => handle("not-interested")}
      >
        {pending === "not-interested" ? "Saving…" : "Not interested"}
      </Button>
      <Button
        className="flex-1"
        disabled={pending !== null}
        onClick={() => handle("applied")}
      >
        {pending === "applied" ? "Saving…" : "Applied"}
      </Button>
    </div>
  );
}
