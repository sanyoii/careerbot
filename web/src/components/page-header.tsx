import type { ReactNode } from "react";
import { ExternalLink, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Optional helper content. When set, renders an info icon next to the
   *  title that opens a modal explaining how this page works. */
  info?: ReactNode;
  /** When set, the title renders as an external link to this URL with a
   *  hover tooltip showing the destination hostname and an external-link
   *  icon. */
  href?: string;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PageHeader({ title, subtitle, right, info, href }: PageHeaderProps) {
  const titleNode = href ? (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${title} (opens in new tab)`}
              className="group/title inline-flex items-center gap-2 rounded-md text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
            >
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <ExternalLink className="h-5 w-5 text-zinc-900 transition-colors group-hover/title:text-blue-600 dark:text-zinc-50 dark:group-hover/title:text-blue-400" />
            </a>
          }
        />
        <TooltipContent>Open on {hostnameOf(href)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      {title}
    </h1>
  );

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-1.5">
          {titleNode}
          {info ? (
            <Dialog>
              <DialogTrigger
                aria-label={`About ${title}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-900/10 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
              >
                <Info className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About {title}</DialogTitle>
                  <DialogDescription render={<div />}>{info}</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
