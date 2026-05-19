/**
 * Fixed-position decorative gradient blobs that sit behind the whole app.
 * Renders different colours in light vs dark via Tailwind's `dark:` variant.
 * No animation — keep it subtle.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950" />

      {/* Top-right blob */}
      <div
        className="absolute -top-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-rose-200/30 blur-3xl dark:bg-violet-500/15"
      />

      {/* Bottom-left blob */}
      <div
        className="absolute -bottom-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-sky-200/30 blur-3xl dark:bg-blue-500/10"
      />
    </div>
  );
}
