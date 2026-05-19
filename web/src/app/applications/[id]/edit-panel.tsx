"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { humanizeSlug, dateInputValue } from "@/lib/format";
import {
  APPLICATION_STATUSES,
  APPLICATION_SOURCES,
  type Application,
} from "@/lib/types";
import { updateApplication, type ApplicationUpdate } from "./actions";

const NONE = "__none__";

interface EditPanelProps {
  application: Application;
}

export function EditPanel({ application }: EditPanelProps) {
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const [status, setStatus] = useState<string>(application.status ?? NONE);
  const [source, setSource] = useState<string>(application.source ?? NONE);
  const [dateFound, setDateFound] = useState(dateInputValue(application.dateFound));
  const [salaryMin, setSalaryMin] = useState(application.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(application.salaryMax?.toString() ?? "");
  const [matchScore, setMatchScore] = useState(application.matchScore?.toString() ?? "");
  const [location, setLocation] = useState(application.location ?? "");
  const [url, setUrl] = useState(application.url ?? "");
  const [notes, setNotes] = useState(application.notes ?? "");

  function save() {
    const patch: ApplicationUpdate = {
      status: status === NONE ? null : (status as Application["status"]),
      source: source === NONE ? null : (source as Application["source"]),
      dateFound: dateFound || null,
      salaryMin: salaryMin === "" ? null : Number(salaryMin),
      salaryMax: salaryMax === "" ? null : Number(salaryMax),
      matchScore: matchScore === "" ? null : Number(matchScore),
      location: location || null,
      url: url || null,
      notes: notes || null,
    };
    setPending(true);
    startTransition(async () => {
      try {
        await updateApplication(application.id, patch);
        toast.success("Application saved");
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
    <GlassCard className="space-y-5 p-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Edit
        </h3>
        <p className="text-xs text-zinc-500">
          Updates write through to the markdown file.
        </p>
      </div>

      <Field label="Status">
        <Select value={status} onValueChange={(v) => setStatus(v ?? NONE)}>
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {humanizeSlug(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Source">
        <Select value={source} onValueChange={(v) => setSource(v ?? NONE)}>
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {APPLICATION_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {humanizeSlug(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Date Found">
        <Input
          type="date"
          value={dateFound}
          onChange={(e) => setDateFound(e.target.value)}
          className="rounded-xl"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Salary Min ($)">
          <Input
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            className="rounded-xl"
          />
        </Field>
        <Field label="Salary Max ($)">
          <Input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            className="rounded-xl"
          />
        </Field>
      </div>

      <Field label="Match Score (1–10)">
        <Input
          type="number"
          min={1}
          max={10}
          value={matchScore}
          onChange={(e) => setMatchScore(e.target.value)}
          className="rounded-xl"
        />
      </Field>

      <Field label="Location">
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-xl"
        />
      </Field>

      <Field label="URL">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-xl"
        />
      </Field>

      <Field label="Notes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px] rounded-xl"
        />
      </Field>

      <Button onClick={save} disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </GlassCard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
