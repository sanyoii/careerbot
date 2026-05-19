"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/glass-card";
import type { Application } from "@/lib/types";
import { updateApplication } from "./actions";

export function NotesPanel({ application }: { application: Application }) {
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const [notes, setNotes] = useState(application.notes ?? "");

  function save() {
    setPending(true);
    startTransition(async () => {
      try {
        await updateApplication(application.id, { notes: notes || null });
        toast.success("Notes saved");
      } catch (err) {
        toast.error("Save failed", {
          description: (err as Error).message,
        });
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <GlassCard className="space-y-4 p-6">
      <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Notes
      </h3>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything you want to remember about this application…"
        className="min-h-[160px] rounded-xl"
      />

      <Button onClick={save} disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save notes"}
      </Button>
    </GlassCard>
  );
}
