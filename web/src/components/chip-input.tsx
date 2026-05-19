"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * Multi-value input: press Enter or , to add a chip, click X to remove.
 * Backspace on empty input removes the last chip.
 */
export function ChipInput({
  value,
  onChange,
  placeholder,
  className,
  id,
}: ChipInputProps) {
  const [draft, setDraft] = React.useState("");

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      remove(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (draft.trim()) add(draft);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-white/40 px-2 py-1.5 text-sm transition focus-within:border-zinc-400 dark:bg-white/[0.04] dark:focus-within:border-white/30",
        className,
      )}
    >
      {value.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-100/80 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10"
        >
          {chip}
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`Remove ${chip}`}
            className="-mr-1 inline-flex h-4 w-4 items-center justify-center rounded text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-50"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[8ch] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
      />
    </div>
  );
}
