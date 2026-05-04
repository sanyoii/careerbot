# Careerbot

An AI career assistant. It researches companies, finds matching open roles, and drafts job applications.


## Setup

1. Fill in `context/`:
   - Copy `context/index.example.md` → `index.md` and link to your background material.
   - Copy `context/preferences.example.md` → `preferences.md` and edit (titles, comp floor, locations, deal-breakers).
   - Drop your `resume.pdf` in `context/`.
2. Optionally add companies you're curious about to `companies/ideas.md` (copy from `ideas.example.md`).
3. Open the repo in the AI agent of your choosing, such as Claude Code, and run `/find-companies`.


## Skills

- **`/find-companies`** — finds companies that match your preferences and writes report on each company in `companies/in-review/<slug>.md`. Companies that are bad matches go into `companies/rejected` so that the agent knows what to avoid in the future.
- **`/find-roles`** — Goes through every company in `companies/interested/`, fetches its careers page, filters open roles against your preferences, and drafts one application per match into `applications/in-review/<company>/`.
- **`/commitandpush`** — commits and pushes changes to Git while checking to make sure no private data is included.


## Workflow

```
         /find-companies──▶  companies/in-review/
                                     │
                                  (you decide)
                                     │
                          ┌──────────┴──────────┐
                          ▼                     ▼
                companies/interested/    companies/rejected/
                          │
                   /find-roles
                          │
                          ▼
              applications/in-review/  ──(you submit)──▶  applications/applied/
```
