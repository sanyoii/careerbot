import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { StatusBadge } from "@/components/status-badge";
import { SetupRequired } from "@/components/setup-required";
import { DataNotConfiguredError } from "@/lib/markdown-store";
import { getCompany } from "@/lib/markdown-store";
import { CompanyDetail } from "@/components/details/company-detail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  let company: Awaited<ReturnType<typeof getCompany>>["company"];
  let blocks: Awaited<ReturnType<typeof getCompany>>["blocks"];
  try {
    const data = await getCompany(id);
    company = data.company;
    blocks = data.blocks;
  } catch (err) {
    if (err instanceof DataNotConfiguredError) {
      return (
        <div className="h-full overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:pt-4 md:pb-12">
            <SetupRequired missing={err.missing} />
          </div>
        </div>
      );
    }
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 md:px-10 md:pt-4 md:pb-12">
          <PageHeader title="Company" />
          <GlassCard className="p-6 text-sm text-rose-600 dark:text-rose-300">
            Failed to load: {(err as Error).message}
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:pt-4 md:pb-12">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Companies
        </Link>

        <PageHeader
          title={company.name}
          subtitle={company.hq ?? undefined}
          right={<StatusBadge status={company.status} kind="company" />}
        />

        <CompanyDetail company={company} blocks={blocks} />
      </div>
    </div>
  );
}
