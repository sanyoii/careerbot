# Context

This folder holds the personal context Careerbot uses to understand your background and what kind of role you're looking for. Everything here is gitignored by default — only the `*.example.md` templates and this README are tracked.

## Setup

1. **Copy the example files** to their real names:

   ```bash
   cp index.example.md index.md
   cp preferences.example.md preferences.md
   ```

2. **Edit `index.md`** — this is the entry point Careerbot reads first. List the files, folders, and links that describe your professional background (resume, personal site, project folders, etc.).

3. **Edit `preferences.md`** — write your current job preferences here: target roles, compensation, location, company stage, tech stack, and anything else that should shape which opportunities Careerbot surfaces. Update this file whenever your preferences change.

4. **Add supporting material** alongside these files:
   - `resume.pdf` — your current resume
   - One folder per significant project or job (see `thunderbolt/`, `gridland/` as examples), each containing notes, write-ups, or links

5. **Keep it current.** Careerbot's output is only as good as what's in this folder. Refresh `preferences.md` and project notes as your situation evolves.

## Files

| File | Purpose | Tracked? |
| --- | --- | --- |
| `AGENTS.md` | Instructions for AI agents reading this folder | yes |
| `README.md` | This file | yes |
| `index.example.md` | Template for `index.md` | yes |
| `preferences.example.md` | Template for `preferences.md` | yes |
| `index.md` | Your entry point — links to everything else | no |
| `preferences.md` | Your current job preferences | no |
| `resume.pdf` | Your resume | no |
| Project folders | Per-project context | no |
