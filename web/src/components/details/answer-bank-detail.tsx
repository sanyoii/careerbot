import type { AnswerBankEntry } from "@/lib/types";
import { AnswerEditor } from "@/app/answer-bank/[id]/editor";

interface AnswerBankDetailProps {
  entry: AnswerBankEntry;
}

export function AnswerBankDetail({ entry }: AnswerBankDetailProps) {
  return <AnswerEditor key={entry.id} entry={entry} />;
}
