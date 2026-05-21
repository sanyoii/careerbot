---
name: add-company
description: Add a single company to the local Companies tree by name (and optional URL), auto-filling HQ, Industry tags, and Remote Policy from research. Writes a new markdown file at companies/interested/<slug>.md. Use whenever the user says "add company X", "track company Y", or otherwise wants to log one specific company they already have in mind. Status defaults to `interested`. This is the lightweight, single-target counterpart to `/find-companies` (which does deep N-company research) — use this when the user names ONE company; use `/find-companies` when they want suggestions / batch research.
---

# Add Company

Add one specific company the user already knows they want to track. Minimal input, AI-filled metadata, single markdown file created at `companies/interested/<slug>.md` per the schema in `SCHEMA.md`.

This skill is **single-target** — one company per run. For batch / discovery / N candidates, use `/find-companies` instead.

## Prerequisites

The `companies/` folder exists at the repo root (it does by default). `SCHEMA.md` exists at the repo root.

## Workflow

### 1. Resolve inputs

The user's request will name a company. Pull from their message:

- **Name** (required) — the company name as the user wrote it.
- **URL** (optional) — if they paste a careers URL, marketing site URL, or LinkedIn company URL. If not provided, skip web lookup and rely on training knowledge alone.

If the name is ambiguous (e.g., the user just says "Linear" without clarification and there are multiple), ask one clarifying question before proceeding.

### 2. Check for duplicates

Derive the slug from the name: lowercase, hyphenated, alphanumeric only (e.g., `"The Browser Company"` → `the-browser-company`).

Check whether a file already exists under any company status folder:

```bash
ls companies/in-review/<slug>.md companies/interested/<slug>.md companies/not-interested/<slug>.md 2>/dev/null
```

Also grep for any frontmatter `slug:` collisions in case the filename differs:

```bash
grep -rl --include='*.md' "^slug: <slug>$" companies/
```

If any match exists:

- Tell the user the company is already tracked. Print the path and current status (= parent folder name).
- Do NOT create a duplicate.
- If the user explicitly asks to "re-add" or "refresh", proceed only after they confirm they want the existing file overwritten.

### 3. Research the company

Use available tools to fill three fields. Try in this order:

1. **WebFetch** (if a URL was provided OR if you can identify the canonical careers / about page). Get HQ, what they do, and remote policy.
2. **WebSearch** — search for `<company> headquarters` and `<company> remote policy` to ground the answer.
3. **Training knowledge** as the final fallback for well-known companies.

You're filling exactly three structured fields:

- **HQ**: a single string like `"San Francisco, CA"` or `"Berlin, Germany"`. Null if genuinely unknown — don't guess.
- **Industry**: 1–3 tags, kebab-case (e.g., `ai-ml`, `dev-tools`, `consumer`, `infrastructure`, `b2b-saas`, `design-tools`, `data`, `fintech`). Empty array if no fit.
- **Remote Policy**: one of `remote`, `hybrid`, `onsite`. Null if unknown.

Keep this fast. The user wants the company in their pipeline now — they can flesh out the profile later or run `/find-companies` for a deep pass.

### 4. Write the markdown file

Create `companies/interested/<slug>.md` with frontmatter per `SCHEMA.md`:

```markdown
---
name: "<Name as user wrote it>"
slug: <slug>
industry: [<comma-separated kebab-case tags, or empty>]
match_score: null
headcount: null
stage: null
valuation: null
hq: "<HQ string or null>"
offices: []
remote_policy: <remote|hybrid|onsite or null>
researched_on: <today YYYY-MM-DD>
not_interested_reason: null
---

<empty body — leave the file with just the frontmatter, user can paste notes or run /find-companies for a full profile later>
```

Use the Write tool. `match_score`, `headcount`, `stage`, `valuation`, `offices` are intentionally null/empty — `/add-company` is the lightweight path; those fields are populated by `/find-companies` or by hand.

**YAML quoting (CRITICAL):** wrap any string value (`name:`, `hq:`) in double quotes when its content contains a `:`, `#`, leading `-`/`*`/`&`/`!`/`?`/`|`/`>`/`%`/`@`/backtick, or could be parsed as a YAML type (`yes`, `no`, `null`, a bare number, an ISO date). An unquoted `:` in a string breaks the entire dashboard's frontmatter parse. When in doubt, quote.

### 5. Report back

Print:

- The path to the new file (`companies/interested/<slug>.md`).
- What was auto-filled (HQ, Industry tags, Remote Policy).
- What was left blank (so the user knows what to expect).
- A note like: "Run `/find-companies` later if you want a full profile (recent news, eng culture, etc.) — this skill only does the lightweight add."

Do NOT commit. The user runs `/commitandpush` when they're ready (and instance files under `companies/interested/` are gitignored anyway, so it won't be pushed).

## Hard rules

- **One company per run.** Never batch. If the user lists multiple, ask them to confirm which one or to use `/find-companies` for batch research.
- **Never duplicate.** Always check by slug across all three status folders first.
- **Status is always `interested`** in this skill. The other status folders are written by `/find-companies` (`in-review/`, `not-interested/`).
- **Never fabricate.** HQ, industry, and remote policy must be either verified or left null/empty.
- **Hard deal-breakers from `context/preferences.md`** still apply — if the user tries to add a company in their avoid list (e.g., a defense contractor when their preferences say no defense), warn them before creating. They can override.
- **Never overwrite an existing file without confirmation.** Step 2's duplicate check is a hard gate.
- **Never `git commit`** — the user runs `/commitandpush`.
