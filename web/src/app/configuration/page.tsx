import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { readPreferences } from "@/lib/preferences";
import { ConfigurationForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  const prefs = await readPreferences();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:pt-4 md:pb-12">
        <PageHeader title="Configuration" />

        <GlassCard className="space-y-2 p-5 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            How this is used
          </div>
          <p className="text-zinc-700 dark:text-zinc-300">
            Your configuration is saved to{" "}
            <code className="rounded bg-zinc-100/80 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
              context/preferences.md
            </code>{" "}
            — YAML frontmatter at the top holds the typed values this form binds
            to, and a human-readable markdown body below is rendered from the
            same data. Two skills read this file:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
            <li>
              <code className="font-mono text-xs">/find-companies</code> — uses
              your role / industry / stage preferences to surface companies you
              haven&apos;t seen yet, and uses your hard filters (industries to
              avoid, excluded companies, comp floor) to reject bad fits silently.
            </li>
            <li>
              <code className="font-mono text-xs">/find-roles</code> — scans
              careers pages at your interested companies, filters open roles
              against your title / comp / location / work-auth preferences, and
              drafts applications for the matches.
            </li>
          </ul>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Each section below shows exactly which skill uses it and whether it
            acts as a <span className="font-medium text-rose-600 dark:text-rose-400">hard filter</span> (reject if it
            doesn&apos;t match) or a <span className="font-medium text-zinc-700 dark:text-zinc-300">soft preference</span> (ranking boost).
          </p>
        </GlassCard>

        <ConfigurationForm initial={prefs} />
      </div>
    </div>
  );
}
