"use client";

import * as React from "react";
import { DetailSheet } from "@/components/detail-sheet";
import { useUnsavedChanges } from "@/components/unsaved-changes";

interface AnswerBankSheetProps {
  open: boolean;
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
}

/**
 * Wraps DetailSheet with the unsaved-changes guard so the X button (and Esc)
 * prompt for confirmation when the editor inside has dirty edits.
 */
export function AnswerBankSheet(props: AnswerBankSheetProps) {
  const { confirmDiscard } = useUnsavedChanges();
  return <DetailSheet {...props} onBeforeClose={confirmDiscard} />;
}
