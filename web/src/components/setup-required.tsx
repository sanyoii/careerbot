import { AlertCircle } from "lucide-react";
import { GlassCard } from "./glass-card";

export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Setup required" />
      <GlassCard className="p-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-3 text-sm">
            <p className="text-zinc-800 dark:text-zinc-200">
              Careerbot can&apos;t find the local data folders. The following
              folders are missing from the repo root:
            </p>
            <ul className="ml-4 list-disc text-zinc-600 dark:text-zinc-300">
              {missing.map((m) => (
                <li key={m}>
                  <code className="rounded bg-zinc-200/60 px-1 py-0.5 dark:bg-white/10">
                    {m}/
                  </code>
                </li>
              ))}
            </ul>
            <ol className="ml-4 list-decimal space-y-1 text-zinc-600 dark:text-zinc-300">
              <li>
                Make sure the web app is running from inside the careerbot
                repository (the folder containing{" "}
                <code className="rounded bg-zinc-200/60 px-1 py-0.5 dark:bg-white/10">
                  SCHEMA.md
                </code>
                ).
              </li>
              <li>
                Create empty directories for any missing folder, or run the
                relevant skill (
                <code className="rounded bg-zinc-200/60 px-1 py-0.5 dark:bg-white/10">
                  /find-companies
                </code>
                ,{" "}
                <code className="rounded bg-zinc-200/60 px-1 py-0.5 dark:bg-white/10">
                  /find-roles
                </code>
                ) to seed them.
              </li>
              <li>
                If the data lives outside the repo, set{" "}
                <code className="rounded bg-zinc-200/60 px-1 py-0.5 dark:bg-white/10">
                  CAREERBOT_DATA_ROOT
                </code>{" "}
                in <code>.env.local</code> to its absolute path.
              </li>
            </ol>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
  );
}
