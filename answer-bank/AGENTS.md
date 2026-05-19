# Answer Bank

Portable raw material the AI uses to synthesize application answers. **Not finished prose** — never store "Why do you want to work at [Company]?" here, because that's an output of synthesis. Store the building blocks instead (beliefs about company culture, stories you can draw on, identity facts).

`/find-roles` reads from this bank, combines the relevant entries with the JD and company profile, and produces a fresh answer in the user's voice for every application.

## Layout

`answer-bank/<theme>/<slug>.md` — one file per entry. Six themes:

| Theme | What lives here |
| --- | --- |
| `identity` | Facts: legal name, email, phone, links, work auth, visa, location, start date, relocation, salary floor, demographic |
| `beliefs` | Stable views about how you work and what you value, written in your voice |
| `stories` | Specific S-A-O anecdotes from your career, tagged by what they illustrate |
| `career` | Past roles annotated; what's next; where heading; companies admired |
| `skills` | Technical stack with comfort levels; daily tools; languages; public artifacts |
| `voice` | Writing samples for the AI to mimic tone; do-say / don't-say lists |

See `SCHEMA.md` at the repo root for the full schema, including how each theme maps to common application questions.

## Frontmatter

```yaml
---
question: "How I think about AI in products I use daily"
tags: [ai-trust, design-systems]
variant_of: null
---
```

- `question`: representative phrasing or short title of what this entry is.
- `tags`: kebab-case; especially load-bearing for `stories` — they determine which story gets picked for which application question.
- `variant_of`: optional pointer to a canonical sibling entry (`<theme>/<slug>`).

The body of each file is the entry content. For `stories`, use S-A-O structure:

```
**Situation:** what was happening.
**Action:** what you did.
**Outcome:** what happened, what you learned.
```

For other themes, freeform prose in your own voice.

## How to seed this folder

Run `/seed-answer-bank` in Claude Code. It walks you through each theme's recommended question list and writes one file per answer. Resumable — re-running only asks about themes you haven't filled.

## Rules

- **Never store company- or role-specific prose here.** The bank is reusable raw material. If you find yourself writing "I want to work at Stripe because…", pull the company name out and write the underlying belief instead.
- **Identity entries are the only ones used verbatim** by `/find-roles`. Everything else gets synthesized.
- **Don't auto-fill `demographic` entries.** Those are personal and the user fills them directly per application.
- **One file per entry.** No multi-answer files. The SQLite import treats `(theme, slug)` as the primary key.
- **`tags` matter most for `stories`.** A well-tagged story is reusable across many application questions; an untagged one is dead weight.
