---
name: seed-answer-bank
description: Interactively fill the Answer Bank one stub at a time. Walks every empty-body file under answer-bank/<theme>/*.md — the gap-driven stubs `/find-roles` generated when it hit a context gap mid-essay. Inserts the user's answer into the body of each stub, never rewriting the existing frontmatter. Resumable — re-running only asks about stubs the user hasn't answered yet. If there are no stubs, it means `/find-roles` hasn't run yet (or has nothing it needed to ask about); tell the user to run `/find-roles` first. Use whenever the user says "seed my answer bank", "fill out my answer bank", "fill the stubs find-roles left me", or wants to add fresh raw material the AI can draw on for future applications.
---

# Seed Answer Bank

Fill the Answer Bank with portable raw material that `/find-roles` synthesizes from when drafting applications. The schema is in `SCHEMA.md`. This skill is interactive: it walks the user through one question at a time and writes one markdown file per answer.

The Answer Bank is **inputs** to AI synthesis, never finished application prose. Don't ever store "Why do you want to work at Anthropic?" here — that's a per-application output. Instead, store the building blocks the AI uses to write that answer (the user's beliefs about company culture, their list of admired companies, their what-makes-a-role-aspirational view).

All questions live as **stubs** — answer-bank files with frontmatter set but an empty body. **Every stub comes from `/find-roles`**, which generates them on demand whenever it hits a context gap while drafting an essay. There's no pre-seeded "starter pack" — the question set is entirely driven by real application demand.

This skill walks every stub in priority order and inserts the user's answer. If `answer-bank/` has no stubs, that means `/find-roles` either hasn't been run or didn't encounter any gaps. Tell the user: *"Nothing to seed yet. Run `/find-companies` (if you don't have companies yet) then `/find-roles` — it'll generate the questions you need to answer based on the actual essays it's trying to draft."* Then exit.

## Prerequisites

- `answer-bank/` exists.
- `SCHEMA.md` exists at repo root.
- The six theme folders (`identity`, `beliefs`, `stories`, `career`, `skills`, `voice`) under `answer-bank/`. Create them if missing.

## Workflow

### 1. Survey what's already there

Walk every file under `answer-bank/<theme>/*.md`. For each theme, count two states:

- **filled** — frontmatter set, body non-empty (trimmed).
- **stub** — frontmatter set, body empty.

Report back like:

```
Identity:  4 filled  /  3 stubs awaiting
Beliefs:   1 filled  /  4 stubs awaiting
Stories:   0 filled  /  1 stub awaiting
Career:    0 filled  /  2 stubs awaiting
Skills:    0 filled  /  0 stubs awaiting
Voice:     0 filled  /  1 stub awaiting
```

**If the total stub count is 0**: print the message in the intro (*"Nothing to seed yet. Run `/find-companies` then `/find-roles` to generate the questions you need to answer."*) and exit cleanly. Don't ask further questions, don't seed anything.

Otherwise ask the user: **"Walk all N stubs now? (yes / pick a theme / skip)"**. Default yes. The default walk order across themes prioritizes essay-unblocking leverage: beliefs → career → stories → skills → voice → identity. Inside a theme, walk in filesystem order.

If the user says "all" or "everything", walk all stubs in the priority order. If they pick a theme, only walk stubs under that theme.

### 2. Walk stubs in batches of ~5, in a multi-question UI

Present stubs to the user in groups of ~5 at a time using whatever multi-question UI the host harness provides (e.g. Claude Code's `AskUserQuestion`, which currently caps at 4 questions per call — round to 4 in that case; if a higher-capacity tool is available, use 5).

**Each question's input format depends on the stub's answer shape:**

- **Multiple-choice for enumerable answers.** Whenever the answer is a short, well-known set, use a multiple-choice UI with the obvious options pre-populated. Examples:
  - `pronouns`: She/her · He/him · They/them · She/they · He/they · (Other)
  - `work-authorization`: Yes · No · (Other)
  - `visa-sponsorship`: Yes, I need sponsorship · No, I don't need sponsorship · (Other)
  - `relocation-openness`: Yes · No · Maybe / depends · (Other)
  - `hybrid-onsite-availability`: Yes, fully on-site OK · Yes, hybrid OK · No, remote only · (Other)
  - Demographic fields (gender, ethnicity, veteran status, disability): always use the standard form options the typical ATS surfaces (e.g. EEO categories), plus "Prefer not to say".
  - Any yes/no question: Yes · No · (Other)
  Always include an "Other" / free-text fallback so the user can write a custom answer.

- **Free-text for everything else.** Legal name, email, phone, URLs, location, beliefs essays, story descriptions, etc. The harness's free-text input (or the "Other" path on a multi-question UI) handles these.

**Within a batch, group thematically.** A batch of 5 should be cohesive (e.g. all identity contact info, or all yes/no logistics, or all beliefs around mission/culture). Don't mix one belief essay with four yes/no logistics in the same batch — the user's mental gear-shift is the cost.

**Walk order:** the user picked the order in step 1 (default beliefs → career → stories → skills → voice → identity, but they can override). Inside a theme, walk in filesystem order, taking the next ~5 stubs each batch.

**After each batch, save every answer immediately, then show the next batch.** Never wait until the end of the walk to save. If the user closes the session mid-walk, every answered stub should already be persisted.

**Skips and stops:**
- If the user leaves a question blank in the multi-question UI, treat it as "skip" — leave the stub empty, will be re-asked next run.
- If the user explicitly says "stop" (in the free-text of any question or as a follow-up message), end the session after saving everything in the current batch, then jump to step 4 (report).

**Per-batch user output:** before launching the multi-question UI, optionally print a one-line progress marker like `Batch 3 of 8 (identity logistics, stubs 11-15 of 30)`. Don't preamble with explanations of what's in the batch — the multi-question UI itself shows the questions.

### 3. Save each answer

Every answer goes into an existing stub file. **Keep the stub's frontmatter byte-for-byte** — don't touch `question:`, `tags:`, or `variant_of:`. `/find-roles` chose those values deliberately when it generated the stub; rewriting them would orphan any application essay that already references the path or matches by tag. Only the body changes.

Result format on disk:

```yaml
---
question: "<existing — do not change>"
tags: [<existing — do not change>]
variant_of: <existing — do not change>
---

<the user's answer, in their voice — keep it as they said it; don't polish unless asked>
```

If for some reason the user asks to add a brand-new question that doesn't have a stub yet, write a fresh file at `answer-bank/<theme>/<slug>.md` with the new question in the frontmatter and the answer in the body. `slug` = lowercased question, alphanumerics + hyphens only, ~50 chars max. On collision append `-2`, `-3`, etc.

### 4. Report at the end

When the session ends (all stubs walked, user said "stop", or user picked a single theme that's now done), summarize:

- Stubs filled this session, grouped by theme (each with the path).
- Stubs still pending, grouped by theme (count is enough — no need to list each).
- Suggestion for what to do next:
  - `/draft-missing-answers` if any stubs got filled this session (will upgrade the partial / TODO essays in `applications/in-review/` that referenced those paths).
  - `/find-roles` if the user is ready to look for new roles and trusts the substrate they've filled in.

## Hard rules

- **Batch in groups of ~5, never solo.** Use the host harness's multi-question UI. If the UI caps at 4 per call (e.g. Claude Code's `AskUserQuestion`), use 4. Solo questions are only acceptable as a last resort when the harness has no multi-question UI at all.
- **Multiple-choice for enumerable answers.** Any field with a known, finite set of common answers (pronouns, work-authorization yes/no, visa-sponsorship, relocation, on-site availability, demographic categories, every yes/no logistics question) must use a multiple-choice UI with sensible defaults pre-populated. Always include an "Other" / free-text fallback. Free-text inputs are only for truly open-ended answers (essays, names, URLs, custom prose).
- **One file per answer.** Don't combine multiple beliefs into one file.
- **Save after every batch.** No multi-batch saves — every batch's answers must land on disk before the next batch is shown, so a session-close mid-walk doesn't lose work.
- **Never put company- or role-specific content in the Answer Bank.** If the user starts writing about a specific company, redirect: "Pull the company-specific framing out — what's the underlying belief / story?"
- **Don't polish the user's voice.** Save what they said. Light cleanup (removing filler "um", capitalization) is OK; rewriting is not.
- **Skip entries that already have a non-empty body** unless the user explicitly asks to overwrite.
- **Never rewrite a stub's frontmatter.** `/find-roles` chose `question:`, `tags:`, and `variant_of:` deliberately so the consumer can find the entry by tag. Only the body changes.
- **Never seed your own questions.** If `answer-bank/` is empty, exit and tell the user to run `/find-roles`. Don't invent question lists, don't generate "useful" stubs proactively. The whole point is that questions come from real essay demand, not from this skill's imagination.
- **Never `git commit`** — the user runs `/commitandpush`.
- **Identity goes in `answer-bank/identity/`, period.** No subfolders by sub-category (no `identity/contact/`, no `identity/auth/`). Flat.
