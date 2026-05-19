"use server";

import path from "node:path";
import { promises as fs } from "node:fs";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import {
  getDataRoot,
  idToParts,
  moveFile,
  patchMarkdownFile,
  pathForApplicationId,
  writeMarkdownFile,
} from "@/lib/markdown-store";
import { replaceApplicationSectionBody } from "@/lib/split-application-blocks";
import {
  APPLICATION_STATUSES,
  APPLICATION_SOURCES,
  type ApplicationSource,
  type ApplicationStatus,
} from "@/lib/types";

export interface ApplicationUpdate {
  status?: ApplicationStatus | null;
  source?: ApplicationSource | null;
  dateFound?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  location?: string | null;
  notes?: string | null;
  url?: string | null;
  matchScore?: number | null;
}

function enumOrUndefined<T extends string>(
  v: T | null | undefined,
  allowed: readonly T[],
): T | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  return allowed.includes(v) ? v : undefined;
}

export async function updateApplication(id: string, patch: ApplicationUpdate) {
  const parts = idToParts(id);
  if (parts.length !== 3) throw new Error(`Invalid application id: ${id}`);
  const [currentStatus, companySlug, filename] = parts;
  const currentAbs = await pathForApplicationId(id);

  // Build the frontmatter patch
  const fmPatch: Record<string, unknown> = {};
  const src = enumOrUndefined(patch.source, APPLICATION_SOURCES);
  if (src !== undefined) fmPatch.source = src;
  if (patch.dateFound !== undefined) fmPatch.date_found = patch.dateFound;
  if (patch.salaryMin !== undefined) fmPatch.salary_min = patch.salaryMin;
  if (patch.salaryMax !== undefined) fmPatch.salary_max = patch.salaryMax;
  if (patch.matchScore !== undefined) fmPatch.match_score = patch.matchScore;
  if (patch.location !== undefined) fmPatch.location = patch.location;
  if (patch.notes !== undefined) fmPatch.notes = patch.notes;
  if (patch.url !== undefined) fmPatch.url = patch.url;

  if (Object.keys(fmPatch).length > 0) {
    await patchMarkdownFile(currentAbs, fmPatch);
  }

  // Status change = move file to the new status folder.
  let finalId = id;
  const status = enumOrUndefined(patch.status, APPLICATION_STATUSES);
  if (status !== undefined && status !== null && status !== currentStatus) {
    const root = await getDataRoot();
    const newAbs = path.join(
      root,
      "applications",
      status,
      companySlug,
      filename + ".md",
    );
    await moveFile(currentAbs, newAbs);
    finalId = [status, companySlug, filename].join("__");
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${finalId}`);
}

/**
 * Replace the body of a single Q&A section in the application's markdown
 * body. Frontmatter is preserved. The `sectionIndex` is 0-based into the
 * sections array returned by `splitApplicationBlocks(blocks, body).sections`,
 * which matches what the Answers tab renders.
 */
export async function updateApplicationAnswerSection(
  id: string,
  sectionIndex: number,
  newBodyText: string,
) {
  const parts = idToParts(id);
  if (parts.length !== 3) throw new Error(`Invalid application id: ${id}`);
  const currentAbs = await pathForApplicationId(id);

  const raw = await fs.readFile(currentAbs, "utf8");
  const parsed = matter(raw);
  const oldBody = parsed.content;

  const newBody = replaceApplicationSectionBody(
    oldBody,
    sectionIndex,
    newBodyText,
  );

  await writeMarkdownFile(
    currentAbs,
    parsed.data as Record<string, unknown>,
    newBody,
  );

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
}
