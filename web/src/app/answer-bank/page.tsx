import { Search, Settings, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { SetupRequired } from "@/components/setup-required";
import {
  listAnswerBank,
  listCompanies,
  getAnswerBankEntry,
} from "@/lib/markdown-store";
import { DataNotConfiguredError } from "@/lib/markdown-store";
import { type AnswerBankEntry, type Company } from "@/lib/types";
import { humanizeSlug } from "@/lib/format";
import { AnswerBankDetail } from "@/components/details/answer-bank-detail";
import { AnswerBankTabs } from "./tabs";
import { AnswerBankSheet } from "./sheet";
import { AnswerStateFilter } from "./answer-state-filter";
import { EmptyStateCard } from "@/components/empty-state-card";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ selected?: string }>;
}

export default async function AnswerBankPage({ searchParams }: PageProps) {
  const { selected } = await searchParams;

  let entries: AnswerBankEntry[];
  let companies: Company[];
  try {
    [entries, companies] = await Promise.all([
      listAnswerBank(),
      listCompanies(),
    ]);
  } catch (err) {
    if (err instanceof DataNotConfiguredError) {
      return (
        <div className="h-full overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8 md:px-10 md:pt-4 md:pb-12">
            <SetupRequired missing={err.missing} />
          </div>
        </div>
      );
    }
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 md:px-10 md:pt-4 md:pb-12">
          <PageHeader title="Answer Bank" />
          <GlassCard className="p-6 text-sm text-rose-600 dark:text-rose-300">
            Failed to load answers: {(err as Error).message}
          </GlassCard>
        </div>
      </div>
    );
  }

  const hasCompanies = companies.length > 0;

  let detail: AnswerBankEntry | null = null;
  const isEmptySentinel = selected === "__empty__";
  if (selected && !isEmptySentinel) {
    try {
      detail = await getAnswerBankEntry(selected);
    } catch {
      detail = null;
    }
  }
  const panelOpen = !!selected;

  return (
    <div className="flex h-full flex-col lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:mx-auto lg:max-w-3xl">
          <div className="flex h-full w-full flex-col gap-4 px-4 pt-4 md:pl-0">
            <PageHeader
              title="Answer Bank"
              right={entries.length > 0 ? <AnswerStateFilter /> : null}
              info={
                <span className="block space-y-2">
                  <span className="block">
                    The Answer Bank holds your raw material, beliefs, stories,
                    facts, voice samples. These entries are used to synthesize
                    answers for every application{" "}
                    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                      /find-roles
                    </code>{" "}
                    drafts.
                  </span>
                  <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                      Run{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                        /seed-answer-bank
                      </code>{" "}
                      in Claude Code to fill in entries you haven&apos;t answered yet.
                    </li>
                    <li>
                      Run{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                        /draft-missing-answers
                      </code>{" "}
                      to backfill TODO / partial essays in your in-review
                      applications using the freshly-filled entries.
                    </li>
                  </ul>
                </span>
              }
            />
            <div className="flex min-h-0 flex-1 flex-col">
              {entries.length === 0 ? (
                <div className="pt-4">
                  <EmptyStateCard
                    title="No questions yet"
                    description="Questions appear here based on the matching roles /find-roles discovers. Each one is something the AI needs to know about you to draft a tailored application."
                    steps={
                      hasCompanies
                        ? [
                            {
                              kind: "command",
                              command: "/find-roles",
                              icon: <Sparkles className="h-3.5 w-3.5" />,
                              description: "Find open roles that match your preferences",
                            },
                          ]
                        : [
                            {
                              kind: "link",
                              href: "/configuration",
                              icon: <Settings className="h-3.5 w-3.5" />,
                              label: "Check configuration",
                              description: "Confirm your preferences and personal context",
                            },
                            {
                              kind: "command",
                              command: "/find-companies",
                              icon: <Search className="h-3.5 w-3.5" />,
                              description: "Research companies that fit your background",
                            },
                            {
                              kind: "command",
                              command: "/find-roles",
                              icon: <Sparkles className="h-3.5 w-3.5" />,
                              description: "Find open roles that match your preferences",
                            },
                          ]
                    }
                  />
                </div>
              ) : (
                <AnswerBankTabs entries={entries} />
              )}
            </div>
          </div>
        </div>

        <AnswerBankSheet
          open={panelOpen}
          title={detail?.question ?? "No entry"}
          subtitle={detail?.theme ? humanizeSlug(detail.theme) : null}
        >
          {detail ? (
            <AnswerBankDetail entry={detail} />
          ) : panelOpen ? (
            <div className="flex h-full items-center justify-center p-10 text-center text-sm text-zinc-500">
              No entry in this category yet.
            </div>
          ) : null}
        </AnswerBankSheet>
      </div>
  );
}
