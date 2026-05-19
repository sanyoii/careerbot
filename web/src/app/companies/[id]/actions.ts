"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import {
  getDataRoot,
  idToParts,
  moveFile,
  pathForCompanyId,
} from "@/lib/markdown-store";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/types";

export async function updateCompanyStatus(id: string, status: CompanyStatus) {
  if (!COMPANY_STATUSES.includes(status)) {
    throw new Error(`Invalid company status: ${status}`);
  }
  const parts = idToParts(id);
  if (parts.length !== 2) throw new Error(`Invalid company id: ${id}`);
  const [currentStatus, slug] = parts;
  if (status === currentStatus) return;

  const currentAbs = await pathForCompanyId(id);
  const root = await getDataRoot();
  const newAbs = path.join(root, "companies", status, slug + ".md");
  await moveFile(currentAbs, newAbs);

  revalidatePath("/companies");
  revalidatePath(`/companies/${[status, slug].join("__")}`);
}
