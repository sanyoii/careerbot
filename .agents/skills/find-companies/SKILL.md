---
name: find-companies
description: Search for companies that match the user's background, skills, and preferences. For each viable match, spawn a research subagent in parallel to produce a deep dossier (products, news, stock/financials, engineering culture, work-life balance, Glassdoor signal, controversies, offices) and write it to companies/in-review/<slug>.md with categorized frontmatter.
---

# Find Companies

Surface companies the user should consider applying to, then queue each one for review with a deep research dossier. The user reviews and decides; this skill never submits applications.

## Workflow

### 1. Load the user's context

Read these in parallel — everything downstream depends on them:

- `context/index.md` — entry point linking to all background material
- `context/preferences.md` — current job preferences (titles, comp floor, locations, target industries, named target companies, deal-breakers)
- `context/resume.pdf` — resume
- Any project folders linked from `context/index.md` (e.g. `context/thunderbolt/`, `context/gridland/`)

### 2. Inventory existing entries to avoid duplicates

Run `ls` against each of:

- `companies/in-review/`
- `companies/interested/`
- `companies/rejected/`
- `applications/in-review/`
- `applications/applied/`

Any company that appears in any of these is already on the user's radar — skip it later. **Anything in `companies/rejected/` is a hard skip — never re-surface it.**

### 3. Generate a candidate list

Use whatever web-search and page-fetch capability is available to assemble 10–20 candidate companies. Pull from:

- **`companies/ideas.md`** — the user's free-form list of URLs, company names, and notes. Always include every entry here that doesn't already have a file under `companies/` or `applications/`. Format is loose: bare URLs, bare names, optional `- note` suffix, markdown headings as informal groupings.
- The named-companies list in `preferences.md` (always include any that don't already have a file)
- Industry peers in each target industry from `preferences.md`
- Companies whose tech stack and product overlap with the user's resume and project work
- Recently funded / notable companies in adjacent spaces

### 4. Pre-filter the candidates

For each candidate, decide one of three outcomes before spending research effort:

- **Skip silently** — already exists under `companies/in-review/`, `companies/interested/`, `companies/rejected/`, or `applications/`. Don't write anything.
- **Reject** — clearly violates `preferences.md` (deal-breakers like surveillance tech, defense contractors, gambling, crypto, politically-leaning, anything Elon-affiliated; comp floor unmeetable; location incompatible). Write a short rejection file to `companies/rejected/<slug>.md` (see "Rejection file format" below) so it never gets re-surfaced.
- **Research** — survives pre-filter; proceed to step 5.

Mention the rejected candidates in your reply too — the user wants to see who got cut and why.

### 5. Spawn one research subagent per surviving candidate, in parallel

Dispatch the candidates to whatever sub-agent / parallel-task mechanism the host harness provides. Launch them concurrently — issue all dispatch calls in a single batch so the research happens in parallel rather than serially.

Each sub-agent prompt must be **self-contained** — assume the sub-agent has no view of this conversation and no shared memory with you. Include:

- The company name
- A summary of the user's preferences and background it should match against (paste the relevant excerpts from `preferences.md` and `context/index.md` — do not just reference them by path; the sub-agent may not read the same files you did)
- The full **File format** spec (below) so it writes the file correctly
- The full **Research dimensions** list (below)
- The full **Match score calibration** rubric (below)
- The output routing rule: **if final `match_score` ≥ 5**, write a dossier to `companies/in-review/<slug>.md`. **If `match_score` ≤ 4**, write a short rejection note to `companies/rejected/<slug>.md` instead (see "Rejection file format" below) — do NOT write a full dossier. Either way, one file per candidate so it never gets re-researched.
- Slug rule: lowercase, hyphenated.
- Instructions to use the host's web-search / page-fetch tools freely, cite sources inline as links, and never invent facts
- A request for a one-line summary AND the final `match_score` in its return message so this skill can render a final report

If the host harness has no sub-agent mechanism, fall back to researching candidates sequentially in this same conversation, applying the same prompt template and writing the same files.

### 6. Render a summary table

Once all subagents finish, present two tables:

**Researched (in-review)** — `match_score` ≥ 5, sorted by `match_score` descending:

| Company | Industry | Match | Size | Why it fits (one line) |

**Rejected** — pre-filter rejections from step 4 plus subagent rejections (`match_score` ≤ 4):

| Company | Reason | File |

Call out any companies a subagent flagged with serious concerns even if they cleared the threshold.

## File format

Dossier files live at `companies/in-review/<slug>.md` (`match_score` ≥ 5). Frontmatter:

```yaml
---
name: "Company Name"
slug: company-slug
industry: [ai, dev-tools, infrastructure, data]   # one or more; use kebab-case tags
match_score: 8                                     # 1-10, calibrated per "Match score calibration" below
size:
  headcount: 500                                   # approximate integer
  stage: "Series C"                                # or "public" | "private" | "pre-IPO" | "bootstrapped"
  market_cap_usd: 1500000000                       # only if public; omit otherwise
  valuation_usd: 800000000                         # only if private and known; omit otherwise
  last_funding: "Series C, $200M, 2025-09"        # if known and relevant
hq: "City, Country"
offices: ["City, Country", ...]
remote_policy: "remote"                            # or "hybrid" | "onsite"
researched_on: YYYY-MM-DD
---
```

Body sections (omit a section entirely if there is genuinely nothing verified to say — never pad):

- `## Why this is a good match` — explicit ties to `preferences.md` and the user's resume / projects
- `## What they do` — current products, primary business, who their customers are
- `## Recent news` — last ~6 months: launches, funding, leadership, layoffs, partnerships
- `## Engineering culture` — tech stack, eng blog highlights, public talks, OSS work, hiring bar signals
- `## Company culture & work-life balance` — Glassdoor themes, Blind/Reddit signal, hours, on-call, RTO posture
- `## Stock / financial trajectory` — public: stock perf + analyst sentiment; private: funding history, revenue/growth if disclosed
- `## Concerns / controversies` — layoffs, lawsuits, exec scandals, ethical issues, customer-base concerns
- `## Open roles` — careers page link; flag any roles matching titles in `preferences.md`
- `## Sources` — full list of URLs cited above

## Rejection file format

Rejection files live at `companies/rejected/<slug>.md`. They exist so the skill (and any future skill) never re-researches a company that's already been ruled out. Keep them short — the point is the verdict, not a dossier. Frontmatter:

```yaml
---
name: "Company Name"
slug: company-slug
match_score: 3                                     # 1-4, or omit if rejected at pre-filter (step 4)
rejected_on: YYYY-MM-DD
rejected_by: "find-companies"                      # the skill that wrote this
reason: "defense contractor"                       # one short phrase; matches the body
---
```

Body: 1–3 sentences explaining the rejection. Cite a source if the reason is a specific factual claim (e.g. "primary customer is the DoD — [source]"). No need for the full research dimensions.

## Research dimensions (paste into each subagent prompt)

The subagent should investigate:

- **Products** — what they ship, who uses it, recent launches, roadmap signals
- **News (last 6 months)** — funding rounds, acquisitions, layoffs, leadership changes, controversies
- **Stock / financials** — for public: stock performance + analyst sentiment; for private: funding history, last-known valuation, revenue if disclosed
- **Engineering culture** — tech stack, engineering blog, conference talks, OSS contributions, interview-process signals
- **Company culture** — Glassdoor ratings + recurring review themes, Blind threads, Reddit, exit-interview reporting
- **Work/life balance** — typical hours, on-call expectations, vacation policy, RTO/remote stance
- **Locations** — offices and remote policy; flag if compatible with the user's preferred cities
- **Concerns** — antitrust, lawsuits, ethical issues, founder/exec controversies, customer-base concerns (defense, surveillance), recent layoffs
- **Match assessment** — explicit comparison to `context/preferences.md` and the user's resume; produce a numeric `match_score` 1-10 with justification

## Match score calibration

- **9–10** — named in `preferences.md` specific-companies list, OR near-perfect fit on industry + role-level + culture + comp + location → `companies/in-review/`
- **7–8** — strong fit on most dimensions; one or two soft mismatches → `companies/in-review/`
- **5–6** — adjacent fit; worth knowing about but not a top target → `companies/in-review/`
- **1–4** — below threshold; write a short rejection note to `companies/rejected/<slug>.md` so it never gets re-researched. Do NOT write a dossier.

## Constraints

- **Never invent facts.** If something can't be verified, omit it or say "not publicly disclosed."
- **Never overwrite** an existing file in `companies/in-review/`, `companies/interested/`, `companies/rejected/`, or `applications/`. Skip the candidate.
- **Never re-surface a rejected company.** Anything in `companies/rejected/` is final unless the user explicitly removes it.
- **Never submit applications.** This skill only surfaces companies for the user's review.
- **One file per company**, in either `companies/in-review/` or `companies/rejected/` based on `match_score`. Per-role tracking belongs in `applications/`.
- **Cite every non-obvious claim.** Inline links in the body, full list in `## Sources`.
- **Hard deal-breakers in `preferences.md` are absolute.** Do not surface a defense contractor or a crypto company because the match-score math otherwise looks good.
