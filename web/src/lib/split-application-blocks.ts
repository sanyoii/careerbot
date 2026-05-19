import type { InlineSegment, RenderableBlock } from "./types";

export interface ApplicationSection {
  heading: string;
  headingLevel: 2 | 3;
  blocks: RenderableBlock[];
  /** Raw markdown source for this section's body (no heading line). Used by
   *  inline section editors and by the server action that writes edits back.
   *  Leading/trailing blank lines are trimmed for display ergonomics. */
  bodyText: string;
}

export interface SplitResult {
  /** Blocks under a JD-matching heading. Empty if no JD heading exists. */
  jd: RenderableBlock[];
  /** Every non-JD H2/H3 section with its heading + body blocks. */
  sections: ApplicationSection[];
}

/** Line-range view of the source — used by the server action that needs to
 *  splice a new body into a specific section without disturbing the rest of
 *  the file. */
export interface SourceSection {
  heading: string;
  headingLevel: 2 | 3;
  /** 0-based line index of the heading line in the source. */
  headingLine: number;
  /** Inclusive line range of the body. When `bodyEndLine < bodyStartLine`
   *  the body is empty (heading immediately followed by EOF or the next
   *  boundary). */
  bodyStartLine: number;
  bodyEndLine: number;
}

export interface SourceSplit {
  /** All sections in the same order as splitApplicationBlocks().sections. */
  sections: SourceSection[];
}

const JD_HEADING_PATTERNS = [
  "job description",
  "role context",
  "about the role",
  "about this role",
  "the role",
  "role overview",
];

/** H2 headings that mark the transition from JD to form questions — they're
 *  pure wrappers (no body of their own), so we drop them instead of rendering
 *  them as empty section cards. */
const FORM_WRAPPER_PATTERNS = [
  "application form responses",
  "application form",
  "application questions",
  "form responses",
];

function inlineText(segments: InlineSegment[]): string {
  return segments.map((s) => s.text).join("").trim();
}

/**
 * Flatten a list of markdown blocks into plain text suitable for clipboard copy.
 * Paragraphs and list items each become their own line. Lists get bullet
 * prefixes; numbered lists get `1.` `2.` etc. Headings, code, and callouts
 * fall back to their text content. Dividers and unsupported blocks are
 * skipped.
 */
export function blocksToPlainText(blocks: RenderableBlock[]): string {
  const lines: string[] = [];
  let numberCounter = 0;

  for (const block of blocks) {
    if (block.kind === "numbered_list_item") {
      numberCounter += 1;
    } else {
      numberCounter = 0;
    }

    switch (block.kind) {
      case "heading_1":
      case "heading_2":
      case "heading_3":
      case "paragraph":
      case "callout":
      case "code":
        lines.push(inlineText(block.text));
        break;
      case "bulleted_list_item":
        lines.push(`- ${inlineText(block.text)}`);
        break;
      case "numbered_list_item":
        lines.push(`${numberCounter}. ${inlineText(block.text)}`);
        break;
      case "divider":
      case "unsupported":
        break;
      default:
        break;
    }
  }

  return lines.filter((l) => l.length > 0).join("\n\n");
}

function isJdHeading(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return JD_HEADING_PATTERNS.includes(normalized);
}

function isFormWrapperHeading(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return FORM_WRAPPER_PATTERNS.includes(normalized);
}

/**
 * Splits an application's markdown blocks into a Job Description bucket and an
 * ordered list of Q&A sections (one H2 per section).
 *
 * - The first H2 whose heading matches a JD pattern (case-insensitive) is
 *   treated as the JD section. Its blocks (including H3 subsections within it)
 *   go into `jd`; only the H2 heading block itself is dropped.
 * - Every other H2 starts a new entry in `sections`. Blocks following the H2
 *   heading (until the next H2) are attached to that section, H3 subsections
 *   included.
 * - H3 blocks are treated as in-section content, NOT new sections. This is
 *   important because postings often use H3 subsections (About the Company,
 *   Responsibilities, Requirements, etc.) WITHIN the JD body.
 * - Blocks before the first H2 are bucketed into a synthetic "Overview"
 *   section so nothing gets lost.
 */
export function splitApplicationBlocks(
  blocks: RenderableBlock[],
  source: string,
): SplitResult {
  const sectionsAcc: { heading: string; headingLevel: 2 | 3; blocks: RenderableBlock[] }[] = [];
  const jd: RenderableBlock[] = [];

  let target: "jd" | "preamble" | "discard" | number = "preamble";
  const preamble: RenderableBlock[] = [];

  for (const block of blocks) {
    if (block.kind === "heading_2") {
      const text = inlineText(block.text);
      if (!text) continue;

      if (isJdHeading(text) && jd.length === 0) {
        target = "jd";
        // Drop the heading itself — the tab already labels itself "Job Description".
        continue;
      }

      if (isFormWrapperHeading(text)) {
        // Pure transition marker: pop out of JD but don't create a section
        // for the wrapper itself. Any non-heading content between the wrapper
        // and the first H3 is discarded — the H3s that follow each become
        // their own Q&A section.
        target = "discard";
        continue;
      }

      sectionsAcc.push({ heading: text, headingLevel: 2, blocks: [] });
      target = sectionsAcc.length - 1;
      continue;
    }

    // H3 behaviour depends on which bucket we're in:
    //  - Inside the JD bucket, H3 acts as a subsection within the JD (kept as content).
    //  - Outside the JD bucket, H3 starts its own Q&A section (each form question
    //    is typically authored at H3 inside a wrapper H2 like "Application form
    //    responses").
    if (block.kind === "heading_3") {
      const text = inlineText(block.text);
      if (!text) continue;

      if (target === "jd") {
        jd.push(block);
        continue;
      }

      sectionsAcc.push({ heading: text, headingLevel: 3, blocks: [] });
      target = sectionsAcc.length - 1;
      continue;
    }

    if (target === "preamble") {
      preamble.push(block);
    } else if (target === "jd") {
      jd.push(block);
    } else if (target === "discard") {
      // intentionally dropped — wrapper bridge content
    } else {
      sectionsAcc[target].blocks.push(block);
    }
  }

  // If we collected preamble blocks before any heading, expose them as an
  // "Overview" section at the front so they're still visible somewhere.
  if (preamble.length > 0) {
    sectionsAcc.unshift({
      heading: "Overview",
      headingLevel: 2,
      blocks: preamble,
    });
  }

  // Walk the source once to compute the raw body text for each section. The
  // source walk applies the same JD / wrapper / discard rules so it produces
  // the same sequence as the block walk above; we attach the resulting body
  // text by index.
  const sourceSplit = splitApplicationSource(source);
  const lines = source.split("\n");
  const bodyTexts = sourceSplit.sections.map((s) =>
    extractBody(lines, s.bodyStartLine, s.bodyEndLine),
  );

  const sections: ApplicationSection[] = sectionsAcc.map((s, i) => ({
    heading: s.heading,
    headingLevel: s.headingLevel,
    blocks: s.blocks,
    bodyText: bodyTexts[i] ?? "",
  }));

  return { jd, sections };
}

/**
 * Walks the raw markdown source line-by-line applying the same heading
 * classification rules as `splitApplicationBlocks`. Returns line ranges for
 * each section's body so callers can splice replacements without re-parsing.
 */
export function splitApplicationSource(source: string): SourceSplit {
  const lines = source.split("\n");
  type Acc = {
    heading: string;
    headingLevel: 2 | 3;
    headingLine: number;
    bodyStartLine: number;
    bodyEndLine: number; // tracked as we go; < start if body has no lines yet
  };
  const sections: Acc[] = [];
  const preambleLines: number[] = [];
  let preambleStart = -1;
  let target: "preamble" | "jd" | "discard" | number = "preamble";
  let firstJdSeen = false;

  // Match `## Heading` or `### Heading` lines (allow trailing whitespace).
  const H2 = /^##\s+(.+?)\s*$/;
  const H3 = /^###\s+(.+?)\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const h2 = line.match(H2);
    if (h2) {
      const text = h2[1].trim();
      if (!text) continue;
      if (isJdHeading(text) && !firstJdSeen) {
        target = "jd";
        firstJdSeen = true;
        continue;
      }
      if (isFormWrapperHeading(text)) {
        target = "discard";
        continue;
      }
      sections.push({
        heading: text,
        headingLevel: 2,
        headingLine: i,
        bodyStartLine: i + 1,
        bodyEndLine: i, // empty body until we see body lines
      });
      target = sections.length - 1;
      continue;
    }

    const h3 = line.match(H3);
    if (h3) {
      const text = h3[1].trim();
      if (!text) continue;
      if (target === "jd") {
        // H3 stays inside the JD body — not a new section.
        continue;
      }
      sections.push({
        heading: text,
        headingLevel: 3,
        headingLine: i,
        bodyStartLine: i + 1,
        bodyEndLine: i,
      });
      target = sections.length - 1;
      continue;
    }

    // Non-heading line.
    if (target === "preamble") {
      if (preambleStart < 0) preambleStart = i;
      preambleLines.push(i);
    } else if (typeof target === "number") {
      sections[target].bodyEndLine = i;
    }
    // "jd" and "discard": we don't track body ranges (not editable here).
  }

  // Mirror the block walker's "Overview" section if there were preamble lines
  // with actual content. We ignore preamble that's only blank lines — the
  // block walker doesn't see those (marked.lexer skips blank lines), so
  // unshifting Overview here would misalign the section indexes by one.
  const hasRealPreamble = preambleLines.some(
    (idx) => lines[idx].trim().length > 0,
  );
  if (hasRealPreamble) {
    sections.unshift({
      heading: "Overview",
      headingLevel: 2,
      headingLine: -1, // synthetic — no heading line in the source
      bodyStartLine: preambleStart,
      bodyEndLine: preambleLines[preambleLines.length - 1],
    });
  }

  return {
    sections: sections.map((s) => ({
      heading: s.heading,
      headingLevel: s.headingLevel,
      headingLine: s.headingLine,
      bodyStartLine: s.bodyStartLine,
      bodyEndLine: s.bodyEndLine,
    })),
  };
}

function extractBody(
  lines: string[],
  startLine: number,
  endLine: number,
): string {
  if (endLine < startLine) return "";
  return lines.slice(startLine, endLine + 1).join("\n").replace(/^\n+|\n+$/g, "");
}

/**
 * Returns a new source string with `sections[sectionIndex]`'s body replaced
 * by `newBodyText`. Heading line and surrounding sections are preserved
 * exactly. Throws if the index is out of range.
 */
export function replaceApplicationSectionBody(
  source: string,
  sectionIndex: number,
  newBodyText: string,
): string {
  const split = splitApplicationSource(source);
  const target = split.sections[sectionIndex];
  if (!target) {
    throw new Error(
      `Section index ${sectionIndex} out of range (have ${split.sections.length})`,
    );
  }
  const lines = source.split("\n");
  const newBodyLines = newBodyText.split("\n");
  // If the line immediately following the original body is a heading, keep a
  // blank-line separator between the new body and that heading. The display
  // extractor trims trailing blanks so the user typically won't include one.
  const nextLine = lines[target.bodyEndLine + 1];
  const nextIsHeading = nextLine !== undefined && /^#{2,3}\s/.test(nextLine);
  if (nextIsHeading && newBodyLines[newBodyLines.length - 1] !== "") {
    newBodyLines.push("");
  }
  // Splice from bodyStartLine through bodyEndLine (inclusive) with the new
  // body lines. When the original body was empty (endLine < startLine),
  // deleteCount becomes 0 — we just insert.
  const deleteCount = Math.max(0, target.bodyEndLine - target.bodyStartLine + 1);
  lines.splice(target.bodyStartLine, deleteCount, ...newBodyLines);
  return lines.join("\n");
}
