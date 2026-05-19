import { GlassCard } from "@/components/glass-card";
import { MarkdownBlocks } from "@/components/markdown-blocks";
import { CompanyInReviewActions } from "@/components/company-in-review-actions";
import { formatDate } from "@/lib/format";
import type { Company, RenderableBlock } from "@/lib/types";

interface CompanyDetailProps {
  company: Company;
  blocks: RenderableBlock[];
  layout?: "page" | "sheet";
}

export function CompanyDetail({
  company,
  blocks,
  layout = "page",
}: CompanyDetailProps) {
  const showInReviewActions =
    layout === "sheet" && company.status === "in-review";

  return (
    <>
      <div className={`space-y-6 ${showInReviewActions ? "pb-20" : ""}`}>
        <GlassCard className="p-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
            <Stat label="HQ" value={company.hq ?? "—"} />
            <Stat label="Size" value={company.size ?? "—"} />
            <Stat label="Researched" value={formatDate(company.researchedOn)} />
          </dl>
          {company.industry.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {company.industry.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-zinc-100/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 ring-1 ring-inset ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="p-7">
          <MarkdownBlocks blocks={blocks} />
        </GlassCard>
      </div>

      {showInReviewActions ? (
        <CompanyInReviewActions companyId={company.id} />
      ) : null}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}
