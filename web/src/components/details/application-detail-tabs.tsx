"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, NotebookText, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/glass-card";
import { MarkdownBlocks } from "@/components/markdown-blocks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NotesPanel } from "@/app/applications/[id]/notes-panel";
import { updateApplicationAnswerSection } from "@/app/applications/[id]/actions";
import {
  blocksToPlainText,
  splitApplicationBlocks,
  type ApplicationSection,
} from "@/lib/split-application-blocks";
import { formatSalaryRange, humanizeSlug } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTabIndicator } from "@/lib/use-tab-indicator";
import { StatusActionBar } from "@/components/status-action-bar";
import { updateApplication } from "@/app/applications/[id]/actions";
import { type ApplicationStatus } from "@/lib/types";
import type {
  Application,
  Company,
  RenderableBlock,
} from "@/lib/types";

interface ApplicationDetailTabsProps {
  application: Application;
  blocks: RenderableBlock[];
  /** Raw markdown body — used by the per-section editors in the Answers tab. */
  body: string;
  company: Company | null;
  /** When true and the JD tab is active, renders the in-review action bar
   *  pinned to the bottom of the panel. */
  showInReviewActions?: boolean;
}

const DETAIL_TABS = [
  { value: "jd", label: "Job description" },
  { value: "answers", label: "Answers" },
  { value: "notes", label: "Notes" },
] as const;

export function ApplicationDetailTabs({
  application,
  blocks,
  body,
  company,
  showInReviewActions = false,
}: ApplicationDetailTabsProps) {
  const { jd, sections } = splitApplicationBlocks(blocks, body);
  const [active, setActive] = React.useState<string>("jd");
  const { listRef, setTriggerRef, indicator, firstPaint } =
    useTabIndicator(active);

  // Single "just copied" indicator shared across every Copy button in the Answers tab.
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const onCopy = React.useCallback(async (id: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(
        () => setCopiedId((c) => (c === id ? null : c)),
        1500,
      );
    } catch {
      // Clipboard may be unavailable in insecure contexts — silent no-op.
    }
  }, []);

  // Local file path under the repo, derived from the markdown ID.
  const filePath = `applications/${application.id.split("__").join("/")}.md`;

  return (
    <>
    <Tabs value={active} onValueChange={(v) => setActive(v ?? "jd")} className="flex h-full flex-col gap-0">
      <div className="-mx-5 shrink-0 border-b border-zinc-200/70 px-5 dark:border-white/10">
        <TabsList
          ref={listRef}
          className="relative flex w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent p-0 group-data-horizontal/tabs:h-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {indicator ? (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute -bottom-px left-0 z-10 h-[2.5px] rounded-full bg-zinc-900 dark:bg-white",
                firstPaint ? "" : "transition-all duration-300 ease-out",
              )}
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
            />
          ) : null}

          {DETAIL_TABS.map((tab) => {
            const isActive = active === tab.value;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                ref={setTriggerRef(tab.value)}
                className={cn(
                  "relative z-10 h-10 shrink-0 bg-transparent px-4 text-sm transition-colors",
                  "before:absolute before:inset-x-0 before:top-1 before:bottom-1.5 before:rounded-md before:transition-colors before:content-['']",
                  "data-active:bg-transparent data-active:border-transparent data-active:shadow-none dark:data-active:bg-transparent dark:data-active:border-transparent",
                  isActive
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 hover:before:bg-zinc-100/60 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:before:bg-white/[0.04]",
                )}
              >
                <span className={isActive ? "font-medium" : ""}>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Tab 3 — Notes */}
      <TabsContent
        value="notes"
        className="flex-1 overflow-y-auto pt-4 pb-4"
      >
        <NotesPanel application={application} />
      </TabsContent>

      {/* Tab 2 — Job Description */}
      <TabsContent
        value="jd"
        className={cn(
          "flex-1 space-y-4 overflow-y-auto pt-4",
          showInReviewActions ? "pb-20" : "pb-4",
        )}
      >
        <QuickFacts application={application} company={company} jd={jd} />

        {jd.length > 0 ? (
          <GlassCard className="p-7">
            <MarkdownBlocks blocks={jd} />
          </GlassCard>
        ) : (
          <GlassCard className="space-y-3 p-7">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <NotebookText className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-semibold tracking-tight">
                No Job Description yet
              </h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add a <code className="rounded bg-zinc-100/80 px-1 py-0.5 font-mono text-xs dark:bg-white/10">## Job description</code>{" "}
              or{" "}
              <code className="rounded bg-zinc-100/80 px-1 py-0.5 font-mono text-xs dark:bg-white/10">## Role context</code>{" "}
              section at the top of this application&apos;s markdown file and
              reload.
            </p>
            <code className="inline-block rounded bg-zinc-100/80 px-2 py-1 font-mono text-[11px] text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              {filePath}
            </code>
          </GlassCard>
        )}
      </TabsContent>

      {/* Tab 3 — Answers (one card per form question, in form order). */}
      <TabsContent
        value="answers"
        className="flex-1 space-y-4 overflow-y-auto pt-4 pb-4"
      >
        {sections.map((section, i) => {
          const sectionId = `section-${i}`;
          const plainText = blocksToPlainText(section.blocks);
          return (
            <AnswerSectionCard
              key={`${section.heading}-${i}`}
              section={section}
              sectionIndex={i}
              applicationId={application.id}
              filePath={filePath}
              copyPlainText={plainText}
              copied={copiedId === sectionId}
              onCopy={() => onCopy(sectionId, plainText)}
            />
          );
        })}
      </TabsContent>
    </Tabs>
    {showInReviewActions && active === "jd" ? (
      <StatusActionBar<ApplicationStatus>
        actions={[
          { label: "Not interested", status: "not-interested", variant: "outline" },
          { label: "Applied", status: "applied" },
        ]}
        update={(status) => updateApplication(application.id, { status })}
      />
    ) : null}
    </>
  );
}

function blocksToText(blocks: RenderableBlock[]): string {
  return blocks
    .map((b) => {
      if ("text" in b && Array.isArray(b.text)) {
        return b.text.map((s) => s.text).join("");
      }
      return "";
    })
    .join("\n");
}

function extractSalary(blocks: RenderableBlock[]): string | null {
  const text = blocksToText(blocks);
  // "$156,000 – $234,000" / "$150k - $200k" / "USD 150,000–200,000"
  const range = text.match(
    /\$?\s*(\d{1,3}(?:,\d{3})+|\d+k?)\s*[–-]\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d+k?)/i,
  );
  if (range) return `$${range[1].replace(/^\$/, "")} – $${range[2].replace(/^\$/, "")}`;
  // Single anchor: "minimum $150k" / "$150,000+"
  const single = text.match(/\$\s*(\d{1,3}(?:,\d{3})+|\d+k?)\s*\+/);
  if (single) return `$${single[1]}+`;
  return null;
}

function QuickFacts({
  application,
  company,
  jd,
}: {
  application: Application;
  company: Company | null;
  jd: RenderableBlock[];
}) {
  const hasSalary =
    application.salaryMin != null || application.salaryMax != null;
  const salary = hasSalary
    ? formatSalaryRange(application.salaryMin, application.salaryMax)
    : extractSalary(jd);
  const locationStr = [
    application.location,
    company?.remotePolicy ? humanizeSlug(company.remotePolicy) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const size = company?.size ?? null;
  const industries = company?.industry ?? [];

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: "Compensation",
      value: salary && salary !== "—" ? salary : <NotListed />,
    },
    {
      label: "Location",
      value: locationStr ? locationStr : <NotListed />,
    },
    {
      label: "Size",
      value: size ? size : <NotListed />,
    },
    {
      label: "Industry",
      value:
        industries.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {industries.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-zinc-100/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <NotListed />
        ),
    },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Quick facts
      </h3>
      <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-[max-content_1fr]">
        {rows.map((row) => (
          <React.Fragment key={row.label}>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">
              {row.label}
            </dt>
            <dd className="text-sm text-zinc-800 dark:text-zinc-200">
              {row.value}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </GlassCard>
  );
}

function NotListed() {
  return (
    <span className="italic text-zinc-500 dark:text-zinc-500">Not listed</span>
  );
}


function CopyButton({
  copied,
  disabled,
  onClick,
}: {
  copied: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Nothing to copy" : copied ? "Copied!" : "Copy"}
      aria-label={disabled ? "Nothing to copy" : "Copy answer"}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
        "text-zinc-500 hover:bg-zinc-900/10 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-50",
        "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500",
        copied && "text-emerald-600 dark:text-emerald-400",
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

interface AnswerSectionCardProps {
  section: ApplicationSection;
  sectionIndex: number;
  applicationId: string;
  filePath: string;
  copyPlainText: string;
  copied: boolean;
  onCopy: () => void;
}

function AnswerSectionCard({
  section,
  sectionIndex,
  applicationId,
  filePath,
  copyPlainText,
  copied,
  onCopy,
}: AnswerSectionCardProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(section.bodyText);
  const [pending, startTransition] = React.useTransition();

  // When the source body changes (after a successful save → router.refresh
  // re-renders with the new bodyText), keep the draft in sync if we're not
  // actively editing.
  React.useEffect(() => {
    if (!editing) setDraft(section.bodyText);
  }, [section.bodyText, editing]);

  const startEdit = () => {
    setDraft(section.bodyText);
    setEditing(true);
  };
  const cancelEdit = () => {
    setDraft(section.bodyText);
    setEditing(false);
  };
  const dirty = draft !== section.bodyText;
  const save = () => {
    if (!dirty) return;
    startTransition(async () => {
      try {
        await updateApplicationAnswerSection(applicationId, sectionIndex, draft);
        toast.success("Answer saved");
        setEditing(false);
        router.refresh();
      } catch (err) {
        toast.error("Save failed", {
          description: (err as Error).message,
        });
      }
    });
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {section.heading}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={pending || !dirty}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <>
              <EditButton onClick={startEdit} />
              <CopyButton
                copied={copied}
                disabled={!copyPlainText.trim()}
                onClick={onCopy}
              />
            </>
          )}
        </div>
      </div>

      {editing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[200px] font-mono text-[13.5px] leading-relaxed"
          autoFocus
        />
      ) : section.blocks.length > 0 ? (
        <MarkdownBlocks blocks={section.blocks} />
      ) : (
        <p className="text-sm italic text-zinc-500">
          No answer drafted yet.
        </p>
      )}
      <div className="mt-4 border-t border-zinc-200/60 pt-3 dark:border-white/10">
        <code className="inline-block text-[11px] text-zinc-500 dark:text-zinc-500">
          {filePath}
        </code>
      </div>
    </GlassCard>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Edit answer"
      aria-label="Edit answer"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
        "text-zinc-500 hover:bg-zinc-900/10 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-50",
      )}
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}

