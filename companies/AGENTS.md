# Companies

This folder tracks companies through the research → decision pipeline. The user feeds in raw ideas; you research them; the user moves the profiles between status folders.

Full schema in `SCHEMA.md` at the repo root.

## Layout

- `ideas.md` — free-form list of companies and links the user wants considered. Read this as input when running `/find-companies`. Format is loose: bare URLs, bare company names, or either with a trailing `- note`. Markdown headings are used as informal groupings.
- `in-review/<slug>.md` — research profiles written by `/find-companies` for candidates that meet the minimum match score. One file per company. The user reviews and decides where each goes next.
- `interested/<slug>.md` — companies the user has confirmed they want to be considered for. `/find-roles` walks this folder to look for open roles. Also written directly by `/add-company`.
- `not-interested/<slug>.md` — companies the user has explicitly passed on, OR that `/find-companies` scored below the minimum match threshold (with the reason in `not_interested_reason`). Treat anything here as "do not surface again." (This is the user passing on the company — separate from `applications/rejected/`, which is a company rejecting an application.)

Status is encoded by the parent folder; never repeat it in frontmatter.

## Frontmatter

```yaml
---
name: "Stripe"
slug: stripe                    # unique, kebab-case; matches the filename
industry: [fintech, b2b-saas]
match_score: 9                  # 1–10; null for /add-company entries
headcount: "~5000"
stage: "Series K"
valuation: "$95B"
hq: "San Francisco, CA"
offices: ["San Francisco, CA", "Dublin, IE"]
remote_policy: hybrid           # remote|hybrid|onsite
careers_url: "https://stripe.com/jobs"   # public careers page; shown next to Open roles in the UI
researched_on: 2026-05-12
not_interested_reason: null     # required iff status = not-interested
---
```

Body for `in-review/` and `interested/` files uses H2 sections (Why this is a good match, What they do, Recent news, Engineering culture, Company culture & work-life balance, Stock / financial trajectory, Concerns / controversies, Open roles, Sources). Not-interested profiles carry only 1–3 paragraphs explaining the pass.

## Rules

- Before researching a company from `ideas.md`, check that it doesn't already exist under `in-review/`, `interested/`, or `not-interested/`. Skip it if it does.
- Never move files between `in-review/`, `interested/`, and `not-interested/` on your own — that's the user's decision.
- Never write to `not-interested/` without the user telling you to, unless a skill explicitly produces a pass note (in which case set `not_interested_reason`).
- See `.agents/skills/find-companies/SKILL.md` for the full profile format and the matching rubric.
