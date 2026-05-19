import type {
  Application,
  Company,
  RenderableBlock,
} from "@/lib/types";
import { ApplicationDetailTabs } from "./application-detail-tabs";

interface ApplicationDetailProps {
  application: Application;
  blocks: RenderableBlock[];
  /** Raw markdown body — required so the Answers tab can hand each section's
   *  raw source into its inline editor. */
  body: string;
  company?: Company | null;
  layout?: "page" | "sheet";
}

export function ApplicationDetail({
  application,
  blocks,
  body,
  company,
  layout = "page",
}: ApplicationDetailProps) {
  const showInReviewActions =
    layout === "sheet" && application.status === "in-review";

  return (
    <ApplicationDetailTabs
      application={application}
      blocks={blocks}
      body={body}
      company={company ?? null}
      showInReviewActions={showInReviewActions}
    />
  );
}
