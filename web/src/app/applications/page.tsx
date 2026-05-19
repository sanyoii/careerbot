import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { SetupRequired } from "@/components/setup-required";
import {
  listApplications,
  listCompanies,
  getApplication,
  getCompanyBySlug,
} from "@/lib/markdown-store";
import { DataNotConfiguredError } from "@/lib/markdown-store";
import type { Application, Company, RenderableBlock } from "@/lib/types";
import { ApplicationsTabs } from "./tabs";
import { DetailSheet } from "@/components/detail-sheet";
import { ApplicationDetail } from "@/components/details/application-detail";
import { EmptyStateCard } from "@/components/empty-state-card";
import { AlertTriangle, Building2, Search, Settings, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ selected?: string }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const { selected } = await searchParams;

  let applications: Application[];
  let companies: Company[];
  try {
    [applications, companies] = await Promise.all([
      listApplications(),
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
    return <ErrorState message={(err as Error).message} />;
  }
  const hasCompanies = companies.length > 0;
  const interestedCount = companies.filter((c) => c.status === "interested").length;
  const hasInterested = interestedCount > 0;

  let detail: { application: Application; blocks: RenderableBlock[]; body: string } | null = null;
  let detailCompany: Company | null = null;
  const isEmptySentinel = selected === "__empty__";
  if (selected && !isEmptySentinel) {
    try {
      detail = await getApplication(selected);
      const companySlug = detail.application.companyIds[0];
      if (companySlug) {
        const c = await getCompanyBySlug(companySlug);
        detailCompany = c?.company ?? null;
      }
    } catch {
      detail = null;
    }
  }
  // Panel stays open whenever any `selected` param is present — including
  // the empty sentinel or a lookup miss — so a tab swap into an empty tab
  // doesn't close the user's already-open panel.
  const panelOpen = !!selected;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:mx-auto lg:max-w-3xl">
        <div className="flex h-full w-full flex-col gap-4 px-4 pt-4 md:pl-0">
          <PageHeader
            title="Applications"
            info={
              <div className="space-y-3">
                <p>
                  Job applications drafted by{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                    /find-roles
                  </code>
                  .
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    When{" "}
                    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                      /find-roles
                    </code>{" "}
                    hits a context gap, it adds the missing question to your
                    answer bank as a blank for you to fill in. Answer those
                    blanks with{" "}
                    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                      /seed-answer-bank
                    </code>
                    , which walks you through them one at a time.
                  </li>
                  <li>
                    Once those blanks are filled, run{" "}
                    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                      /draft-missing-answers
                    </code>
                    . It draws on the answer bank to re-synthesize the empty
                    Q&amp;A sections of your drafted applications.
                  </li>
                </ul>
              </div>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col">
            {applications.length === 0 ? (
              <div className="space-y-4 pt-4">
                {hasCompanies && !hasInterested ? (
                  <NoInterestedWarning total={companies.length} />
                ) : null}
                <EmptyStateCard
                  title="No applications yet"
                  description={
                    !hasCompanies
                      ? "Set your preferences first so /find-companies and /find-roles know what to look for, then research companies and scan their openings."
                      : !hasInterested
                      ? "Move at least one researched company into Interested so /find-roles knows where to scan."
                      : "You have companies marked as interested. Run /find-roles to scan their careers pages for openings that match your preferences."
                  }
                  steps={
                    !hasCompanies
                      ? [
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
                      : !hasInterested
                      ? [
                          {
                            kind: "link",
                            href: "/companies",
                            icon: <Building2 className="h-3.5 w-3.5" />,
                            label: "Open Companies",
                            description: "Move profiles from In review to Interested",
                          },
                          {
                            kind: "command",
                            command: "/find-roles",
                            icon: <Sparkles className="h-3.5 w-3.5" />,
                            description: "Scan careers pages of your Interested companies",
                          },
                        ]
                      : [
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
              <ApplicationsTabs applications={applications} />
            )}
          </div>
        </div>
      </div>
      <DetailSheet
        open={panelOpen}
        title={detail?.application.title ?? "No application"}
        subtitle={detail?.application.companyName ?? null}
        href={detail?.application.url ?? null}
      >
        {detail ? (
          <ApplicationDetail
            application={detail.application}
            blocks={detail.blocks}
            body={detail.body}
            company={detailCompany}
            layout="sheet"
          />
        ) : panelOpen ? (
          <div className="flex h-full items-center justify-center p-10 text-center text-sm text-zinc-500">
            No application in this status.
          </div>
        ) : null}
      </DetailSheet>
    </div>
  );
}

function NoInterestedWarning({ total }: { total: number }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 backdrop-blur-sm dark:border-amber-400/25 dark:bg-amber-500/[0.08] dark:text-amber-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          No companies marked as Interested
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80 dark:text-amber-100/70">
          You have {total} researched compan{total === 1 ? "y" : "ies"}, but none are in Interested yet.{" "}
          <code className="rounded bg-amber-900/10 px-1 py-0.5 font-mono text-[11px] dark:bg-amber-100/10">
            /find-roles
          </code>{" "}
          only scans companies in that status, so it will return nothing until you triage at least one.{" "}
          <Link
            href="/companies"
            className="font-medium underline-offset-2 hover:underline"
          >
            Open Companies
          </Link>{" "}
          to move profiles from In review to Interested.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 md:px-10 md:pt-4 md:pb-12">
        <PageHeader title="Applications" />
        <GlassCard className="p-6 text-sm text-rose-600 dark:text-rose-300">
          Failed to load applications: {message}
        </GlassCard>
      </div>
    </div>
  );
}
