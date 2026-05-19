"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ExternalLink, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DetailSheetProps {
  /** When false, the panel animates out and then unmounts. Parents can pass
   *  empty `title`/`children` alongside `open=false`; the panel latches the
   *  last "open" values internally so the exit frame still shows real content. */
  open: boolean;
  title: string;
  subtitle?: string | null;
  /** When set, the title renders as an external link to this URL with a
   *  hover tooltip showing the destination hostname and an external-link
   *  icon. */
  href?: string | null;
  /** Optional element rendered inline right after the title (e.g. a copy button). */
  titleAction?: React.ReactNode;
  children: React.ReactNode;
  /** Called before X-click or Esc actually closes the sheet. If it returns
   *  (or resolves to) false, the close is aborted. Use this to surface an
   *  "unsaved changes" confirmation. */
  onBeforeClose?: () => boolean | Promise<boolean>;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const DEFAULT_WIDTH_PX = 560;
const MIN_WIDTH_PX = 380;
const MAX_WIDTH_PX = 960;
// Bumped from v1 because the original default was a fixed 560px; v2 defaults
// to 50% of the parent container so the list and detail panel open 1:1.
const WIDTH_STORAGE_KEY = "careerbot-panel-width-v2";

// Linear's signature spring curve — fast start, smooth tail, no overshoot.
// One curve & duration for enter + exit so the panel reads as one motion vocabulary.
const SLIDE_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const SLIDE_MS = 320;

interface LatchedProps {
  title: string;
  subtitle: string | null | undefined;
  href: string | null | undefined;
  titleAction: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Inline right-side detail panel anchored to the URL via `?selected=<id>`.
 *
 * Renders as a real flex child (no portal, no backdrop), so the list to its
 * left shrinks to make room instead of being overlaid. The user can drag the
 * left edge of the panel to resize it; the width is persisted to localStorage.
 *
 * Animates open & closed using a width + translate combo with matched timing:
 * the width animation drives the smooth reflow of the sibling middle column;
 * the translate slides the content into the opening so they read as one motion.
 *
 * Esc / X / close handler pushes the URL back to the list (clearing `selected`),
 * so the browser back button naturally pops the panel state.
 */
export function DetailSheet({
  open,
  title,
  subtitle,
  href,
  titleAction,
  children,
  onBeforeClose,
}: DetailSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [width, setWidth] = React.useState(DEFAULT_WIDTH_PX);
  const [resizing, setResizing] = React.useState(false);
  const asideRef = React.useRef<HTMLElement>(null);

  // `isOpen` is the local source of truth for the animation. It mirrors the
  // `open` prop, but `close()` flips it immediately so the slide-out starts
  // on click instead of waiting for the server re-render that `router.push`
  // round-trips through (which would otherwise read as a "stuck" middle column).
  const [isOpen, setIsOpen] = React.useState(open);
  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Two-stage animation state:
  //   `mounted` controls DOM presence — stays true through the exit transition.
  //   `active`  drives data-state — flips one frame after mount so the CSS
  //             transition actually fires (mounting in the target state would
  //             skip the transition entirely).
  const [mounted, setMounted] = React.useState(open);
  const [active, setActive] = React.useState(open);

  React.useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(id);
    }
    setActive(false);
    const t = window.setTimeout(() => setMounted(false), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Latch the last "open" props so the exit frame still shows real content
  // after the parent drops its data. Mutating a ref during render is the
  // standard pattern for "remember the previous version of a prop".
  const latched = React.useRef<LatchedProps>({
    title,
    subtitle,
    href,
    titleAction,
    children,
  });
  if (isOpen) {
    latched.current = { title, subtitle, href, titleAction, children };
  }

  // Hydrate width: a saved preference wins; otherwise default to 50% of the
  // parent column so the list and the panel open at a 1:1 ratio. Layout-phase
  // so the panel never visibly snaps to the wrong width on first paint.
  React.useLayoutEffect(() => {
    const stored = window.localStorage.getItem(WIDTH_STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed >= MIN_WIDTH_PX) {
        setWidth(Math.min(MAX_WIDTH_PX, parsed));
        return;
      }
    }
    const parent = asideRef.current?.parentElement;
    if (parent && parent.offsetWidth > 0) {
      const half = Math.round(parent.offsetWidth / 2);
      setWidth(Math.max(MIN_WIDTH_PX, Math.min(MAX_WIDTH_PX, half)));
    }
  }, []);

  const close = React.useCallback(async () => {
    if (onBeforeClose) {
      const allow = await onBeforeClose();
      if (!allow) return;
    }
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams, onBeforeClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // Drag-to-resize: track mouse globally while a drag is in progress.
  React.useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const next = Math.max(
        MIN_WIDTH_PX,
        Math.min(MAX_WIDTH_PX, window.innerWidth - e.clientX),
      );
      setWidth(next);
    };
    const onUp = () => {
      setResizing(false);
      window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing, width]);

  if (!mounted) return null;

  const {
    title: latchedTitle,
    subtitle: latchedSubtitle,
    href: latchedHref,
    titleAction: latchedAction,
    children: latchedChildren,
  } = latched.current;

  return (
    <aside
      ref={asideRef}
      data-state={active ? "open" : "closed"}
      style={
        {
          "--panel-width": `${width}px`,
          // Suppress the transition while the user drags the resize handle so
          // the panel tracks the cursor 1:1. Re-enabled on mouseup.
          transition: resizing
            ? "none"
            : `width ${SLIDE_MS}ms ${SLIDE_EASING}, margin ${SLIDE_MS}ms ${SLIDE_EASING}, transform ${SLIDE_MS}ms ${SLIDE_EASING}, opacity ${SLIDE_MS}ms ${SLIDE_EASING}`,
        } as React.CSSProperties
      }
      className={cn(
        "glass-strong relative flex shrink-0 flex-col self-start overflow-hidden rounded-2xl border",
        "border-zinc-200/60 dark:border-white/10",
        // Mobile (stacked layout): fade only — a horizontal slide makes no sense
        // when the panel sits below the list.
        "w-full max-lg:data-[state=closed]:opacity-0",
        // Desktop: width + right margin animate together so the flex slot
        // collapses fully to 0 (no stub, no end-of-animation jump in the
        // middle column). Transform slides the panel content into the
        // opening as it grows. All share the same duration & easing so they
        // read as one motion.
        "lg:my-4 lg:h-[calc(100%-2rem)] lg:self-stretch",
        "lg:w-[var(--panel-width)] lg:data-[state=closed]:w-0",
        "lg:mr-4 lg:data-[state=closed]:mr-0",
        "lg:translate-x-0 lg:data-[state=closed]:translate-x-full",
      )}
    >
      {/* Resize handle — left edge, desktop only */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setResizing(true);
        }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        className="absolute inset-y-0 left-0 z-20 hidden w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-zinc-900/[0.06] active:bg-zinc-900/[0.1] dark:hover:bg-white/[0.08] dark:active:bg-white/[0.12] lg:block"
      />

      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/70 px-5 py-2 backdrop-blur-xl dark:bg-zinc-950/40">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {latchedSubtitle ? (
            <span className="shrink-0 font-heading text-base font-normal text-zinc-500 dark:text-zinc-400">
              {latchedSubtitle}
            </span>
          ) : null}
          {latchedHref ? (
            <TooltipProvider delay={0}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={latchedHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${latchedTitle} (opens in new tab)`}
                      className="group/title inline-flex min-w-0 items-center gap-1.5 rounded-md text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                    >
                      <h2 className="min-w-0 truncate font-heading text-base font-semibold tracking-tight">
                        {latchedTitle}
                      </h2>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-900 transition-colors group-hover/title:text-blue-600 dark:text-zinc-50 dark:group-hover/title:text-blue-400" />
                    </a>
                  }
                />
                <TooltipContent>Open on {hostnameOf(latchedHref)}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <h2 className="min-w-0 truncate font-heading text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {latchedTitle}
            </h2>
          )}
          {latchedAction}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Close panel"
            onClick={close}
            className="text-zinc-500 hover:bg-zinc-900/10 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-50"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">{latchedChildren}</div>
    </aside>
  );
}
