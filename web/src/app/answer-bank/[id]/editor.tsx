"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/components/unsaved-changes";
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
import { humanizeSlug } from "@/lib/format";
import {
  ANSWER_THEMES,
  type AnswerBankEntry,
  type AnswerTheme,
} from "@/lib/types";
import { updateAnswerBank, type AnswerBankUpdate } from "./actions";

const NONE = "__none__";

export function AnswerEditor({ entry }: { entry: AnswerBankEntry }) {
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const initialQuestion = entry.question;
  const initialTheme = entry.theme ?? NONE;
  const initialTags = entry.tags.join(", ");
  const initialAnswer = entry.canonicalAnswer ?? "";

  const [question, setQuestion] = useState(initialQuestion);
  const [theme, setTheme] = useState<string>(initialTheme);
  const [tags, setTags] = useState(initialTags);
  const [answer, setAnswer] = useState(initialAnswer);

  const dirty =
    question !== initialQuestion ||
    theme !== initialTheme ||
    tags !== initialTags ||
    answer !== initialAnswer;

  // Push the editor's dirty state up to the page-level provider so navigation
  // (row clicks, sheet X, browser back) can warn before discarding edits.
  // On unmount we explicitly reset to false so the next entry starts clean.
  const { setDirty } = useUnsavedChanges();
  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);
  useEffect(() => {
    return () => setDirty(false);
  }, [setDirty]);

  function save() {
    const patch: AnswerBankUpdate = {
      question: question.trim() || "(no question)",
      theme: theme === NONE ? null : (theme as AnswerTheme),
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      canonicalAnswer: answer || null,
    };
    setPending(true);
    startTransition(async () => {
      try {
        await updateAnswerBank(entry.id, patch);
        toast.success("Answer saved");
        // Treat the just-saved values as the new baseline so dirty resets.
        // The page re-fetches on revalidatePath, so the editor will remount
        // with the new entry — this is mostly a belt-and-braces guard.
        setDirty(false);
      } catch (err) {
        toast.error("Save failed", { description: (err as Error).message });
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <>
    <div className="space-y-5 pt-4 pb-20">
      <Field label="Question">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-xl text-base"
        />
      </Field>

      <Field label="Theme">
        <Select value={theme} onValueChange={(v) => setTheme(v ?? NONE)}>
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>—</SelectItem>
            {ANSWER_THEMES.map((t) => (
              <SelectItem key={t} value={t}>
                {humanizeSlug(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Tags (comma-separated)">
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ai, leadership, startup"
          className="rounded-xl"
        />
      </Field>

      <Field label="Canonical Answer">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[400px] rounded-xl font-mono text-[13.5px] leading-relaxed"
        />
      </Field>

    </div>
    <div className="absolute right-0 bottom-0 left-0 z-10 flex justify-end border-t border-zinc-200/60 bg-white px-5 py-3 dark:border-white/10 dark:bg-zinc-950">
      <Button onClick={save} disabled={pending || !dirty}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
    </>
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
