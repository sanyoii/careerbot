import { Search, Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { SetupRequired } from "@/components/setup-required";
import { listCompanies, getCompany } from "@/lib/markdown-store";
import { DataNotConfiguredError } from "@/lib/markdown-store";
import type { Company, RenderableBlock } from "@/lib/types";
import { CompaniesTabs } from "./tabs";
import { DetailSheet } from "@/components/detail-sheet";
import { CompanyDetail } from "@/components/details/company-detail";
import { EmptyStateCard } from "@/components/empty-state-card";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ selected?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const { selected } = await searchParams;

  let companies: Company[];
  try {
    companies = await listCompanies();
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
          <PageHeader
            title="Companies"
            info={
              <span className="block space-y-2">
                <span className="block">
                  Company profiles researched by{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                    /find-companies
                  </code>
                  .
                </span>
                <ul className="ml-5 list-disc space-y-1.5">
                  <li>
                    Move profiles from <strong>In review</strong> to{" "}
                    <strong>Interested</strong> to mark companies you want to
                    apply to.
                  </li>
                  <li>
                    Run{" "}
                    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                      /find-roles
                    </code>{" "}
                    to scan Interested companies for open roles.
                  </li>
                </ul>
              </span>
            }
          />
          <GlassCard className="p-6 text-sm text-rose-600 dark:text-rose-300">
            Failed to load companies: {(err as Error).message}
          </GlassCard>
        </div>
      </div>
    );
  }

  let detail: { company: Company; blocks: RenderableBlock[] } | null = null;
  const isEmptySentinel = selected === "__empty__";
  if (selected && !isEmptySentinel) {
    try {
      detail = await getCompany(selected);
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
            title="Companies"
            info={
              <span className="block space-y-2">
                <span className="block">
                  Company profiles researched by{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                    /find-companies
                  </code>
                  .
                </span>
                <ul className="ml-5 list-disc space-y-1.5">
                  <li>
                    Move profiles from <strong>In review</strong> to{" "}
                    <strong>Interested</strong> to mark companies you want to
                    apply to.
                  </li>
                  <li>
                    Run{" "}
                    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                      /find-roles
                    </code>{" "}
                    to scan Interested companies for open roles.
                  </li>
                </ul>
              </span>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col">
            {companies.length === 0 ? (
              <div className="pt-4">
                <EmptyStateCard
                  title="No companies yet"
                  description="Set your preferences first so /find-companies knows what kind of company to look for, then run it to build your shortlist."
                  steps={[
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
                  ]}
                />
              </div>
            ) : (
              <CompaniesTabs companies={companies} />
            )}
          </div>
        </div>
      </div>

      <DetailSheet
        open={panelOpen}
        title={detail?.company.name ?? "No company"}
      >
        {detail ? (
          <CompanyDetail
            company={detail.company}
            blocks={detail.blocks}
            layout="sheet"
          />
        ) : panelOpen ? (
          <div className="flex h-full items-center justify-center p-10 text-center text-sm text-zinc-500">
            No company in this status.
          </div>
        ) : null}
      </DetailSheet>
    </div>
  );
}
