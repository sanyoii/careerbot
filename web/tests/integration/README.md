# Integration tests (opt-in, real Claude calls)

These tests exercise the actual slash-command skills end-to-end by spawning the `claude` CLI. They're **not** part of the default `pnpm test` run because:

- They cost real Anthropic API tokens.
- They depend on live web fetches and AI output, so they're non-deterministic.
- They take 30 seconds to several minutes per test.
- They require the `claude` CLI to be installed and authenticated.

## Requirements

- `claude` CLI on `PATH`. Install via the Claude Code instructions at <https://docs.claude.com>.
- An authenticated session (Anthropic account with API billing enabled).

## Running

```bash
RUN_LIVE_SKILLS=1 pnpm test:live
```

The default `pnpm test` command skips these tests automatically.

## Scope

Today there's a single test, `/find-companies populates companies/in-review/`. It:

1. Sets up a fresh temp data root (preferences absent, all data dirs empty).
2. Seeds a minimal `companies/ideas.md` with one well-known company URL.
3. Runs `claude -p "/find-companies"` with `cwd` set to the temp data root.
4. Asserts that at least one valid company markdown file appears under `companies/in-review/`.

The test only checks **structural** validity (file exists, frontmatter has `name` + `slug` + `industry` array). It does not assert on content quality — that's reviewed manually.

Add new live tests sparingly. Each one slows the suite and costs money.
