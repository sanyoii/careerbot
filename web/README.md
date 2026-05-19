# Careerbot Web

A glassy, minimalist Next.js dashboard over the local markdown that backs Careerbot: applications, companies, and the answer bank. Full read + write directly to the markdown files under `../applications/`, `../companies/`, and `../answer-bank/`.

## Prerequisites

- Node.js 22+
- pnpm 10+

Data is read from the parent repo's markdown tree. Schema is documented in `../SCHEMA.md`.

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # only needed for the optional Anthropic key
pnpm dev
```

Then open http://localhost:3000.

By default the app walks up from `process.cwd()` looking for `SCHEMA.md` to find the data root. To point at a different repo, set `CAREERBOT_DATA_ROOT` to an absolute path in `.env.local`.

## Other commands

```bash
pnpm build   # production build
pnpm start   # serve the production build
```

## Folder structure

```
src/
  app/
    layout.tsx              AppShell: theme provider, ambient background, sidenav
    page.tsx                Redirects to /applications
    globals.css             Tailwind v4 + glass utility classes
    applications/           List + detail + server actions
    companies/              List + detail + server actions
    answer-bank/            List + detail + server actions
  components/
    side-nav.tsx            Desktop sidenav + mobile Sheet drawer
    theme-provider.tsx      next-themes wrapper
    theme-toggle.tsx        Sun/moon toggle button
    ambient-background.tsx  Fixed gradient blobs behind the app
    glass-card.tsx          Reusable glass surface
    status-badge.tsx        Color-coded status pill
    markdown-blocks.tsx     Static renderer for parsed markdown blocks
    setup-required.tsx      Shown when the data folders can't be found
    page-header.tsx         Standard page header
    ui/                     Shadcn components
  lib/
    markdown-store.ts       File walker + frontmatter parser + write helpers
    parse-markdown.ts       Markdown → RenderableBlock[] (uses `marked`)
    types.ts                Domain types (Application, Company, AnswerBankEntry)
    format.ts               Date/salary/slug formatters
    split-application-blocks.ts  Splits an application body into JD + Q&A
    utils.ts                Shadcn cn() helper
```

## How IDs work

Each row's ID is the file path components joined by `__`:

- Application: `<status>__<company-slug>__<filename-without-ext>` → `applications/<status>/<company-slug>/<filename>.md`
- Company: `<status>__<slug>` → `companies/<status>/<slug>.md`
- Answer bank: `<theme>__<slug>` → `answer-bank/<theme>/<slug>.md`

The schema guarantees slugs are kebab-case, so `__` is an unambiguous separator. Status / theme changes via the UI move the file between folders, which changes the ID.

## Design choices

- **Tailwind v4** with CSS-first `@theme` config in `globals.css`.
- **Shadcn `base-nova`** style is used; the underlying primitive library is `@base-ui/react`.
- Read paths use `react.cache()` so a list + detail render in the same request only hits the filesystem once per page.
- Server Actions handle every write — there is no client-side data fetching layer.
- Markdown body parsing uses `marked`, then emits the same `RenderableBlock[]` shape rendered by `MarkdownBlocks`.
