"use server";

import { revalidatePath } from "next/cache";
import { writePreferences, type Preferences } from "@/lib/preferences";

export async function savePreferences(prefs: Preferences) {
  await writePreferences(prefs);
  revalidatePath("/configuration");
  return { ok: true as const };
}
