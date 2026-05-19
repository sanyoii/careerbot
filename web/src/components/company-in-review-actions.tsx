"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { humanizeSlug } from "@/lib/format";
import { type CompanyStatus } from "@/lib/types";
import { updateCompanyStatus } from "@/app/companies/[id]/actions";

interface CompanyInReviewActionsProps {
  companyId: string;
}

export function CompanyInReviewActions({ companyId }: CompanyInReviewActionsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState<CompanyStatus | null>(null);

  const handle = (status: CompanyStatus) => {
    setPending(status);
    (async () => {
      try {
        await updateCompanyStatus(companyId, status);
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
        onClick={() => handle("interested")}
      >
        {pending === "interested" ? "Saving…" : "Interested"}
      </Button>
    </div>
  );
}
