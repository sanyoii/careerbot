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
  pathForAnswerBankId,
  writeMarkdownFile,
} from "@/lib/markdown-store";
import { ANSWER_THEMES, type AnswerTheme } from "@/lib/types";
import { enumOrUndefined } from "@/lib/enum";

export interface AnswerBankUpdate {
  question?: string;
  theme?: AnswerTheme | null;
  tags?: string[];
  canonicalAnswer?: string | null;
}

export async function updateAnswerBank(id: string, patch: AnswerBankUpdate) {
  const parts = idToParts(id);
  if (parts.length !== 2) throw new Error(`Invalid answer-bank id: ${id}`);
  const [currentTheme, slug] = parts;
  const currentAbs = await pathForAnswerBankId(id);

  // Patch frontmatter fields that aren't the body (canonicalAnswer) and aren't
  // the path-derived theme.
  const fmPatch: Record<string, unknown> = {};
  if (patch.question !== undefined) fmPatch.question = patch.question;
  if (patch.tags !== undefined) fmPatch.tags = patch.tags;

  // canonicalAnswer is the body of the file; rewrite the file when it changes.
  if (patch.canonicalAnswer !== undefined) {
    const raw = await fs.readFile(currentAbs, "utf8");
    const parsed = matter(raw);
    const merged = {
      ...(parsed.data as Record<string, unknown>),
      ...fmPatch,
    };
    await writeMarkdownFile(currentAbs, merged, patch.canonicalAnswer ?? "");
  } else if (Object.keys(fmPatch).length > 0) {
    await patchMarkdownFile(currentAbs, fmPatch);
  }

  // Theme change = move file to the new theme folder.
  let finalId = id;
  const theme = enumOrUndefined(patch.theme, ANSWER_THEMES);
  if (theme !== undefined && theme !== null && theme !== currentTheme) {
    const root = await getDataRoot();
    const newAbs = path.join(root, "answer-bank", theme, slug + ".md");
    await moveFile(currentAbs, newAbs);
    finalId = [theme, slug].join("__");
  }

  revalidatePath("/answer-bank");
  revalidatePath(`/answer-bank/${finalId}`);
}
