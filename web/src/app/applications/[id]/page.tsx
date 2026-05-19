import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { StatusBadge } from "@/components/status-badge";
import { SetupRequired } from "@/components/setup-required";
import { DataNotConfiguredError } from "@/lib/markdown-store";
import { getApplication, getCompanyBySlug } from "@/lib/markdown-store";
import { ApplicationDetail } from "@/components/details/application-detail";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;

  let application: Awaited<ReturnType<typeof getApplication>>["application"];
  let blocks: Awaited<ReturnType<typeof getApplication>>["blocks"];
  let body: string;
  let company: Company | null = null;
  try {
    const data = await getApplication(id);
    application = data.application;
    blocks = data.blocks;
    body = data.body;
    const companySlug = application.companyIds[0];
    if (companySlug) {
      const maybeCompany = await getCompanyBySlug(companySlug);
      if (maybeCompany) company = maybeCompany.company;
    }
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
          <PageHeader title="Application" />
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
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Applications
        </Link>

        <PageHeader
          title={application.title}
          subtitle={application.companyName ?? undefined}
          href={application.url ?? undefined}
          right={<StatusBadge status={application.status} />}
        />

        <ApplicationDetail application={application} blocks={blocks} body={body} company={company} />
      </div>
    </div>
  );
}
