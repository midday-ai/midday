import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import type { IconMap } from "streamdown";

export const streamdownIcons: Partial<IconMap> = {
  CheckIcon: Icons.Check as IconMap["CheckIcon"],
  CopyIcon: Icons.Copy as IconMap["CopyIcon"],
  DownloadIcon: Icons.ArrowDownward as IconMap["DownloadIcon"],
  XIcon: Icons.Close as IconMap["XIcon"],
  ExternalLinkIcon: Icons.OpenInNew as IconMap["ExternalLinkIcon"],
  RotateCcwIcon: Icons.RefreshOutline as IconMap["RotateCcwIcon"],
};

export const streamdownControls = {
  table: { copy: true, download: true, fullscreen: false },
} as const;

export const streamdownClassName = cn(
  "font-sans text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-3",
  "[&_[data-streamdown=table-wrapper]]:rounded-none [&_[data-streamdown=table-wrapper]]:bg-transparent [&_[data-streamdown=table-wrapper]]:p-0 [&_[data-streamdown=table-wrapper]]:border-0 [&_[data-streamdown=table-wrapper]]:gap-1",
  "[&_[data-streamdown=table-wrapper]_>div:last-child]:rounded-none",
  "[&_[data-streamdown=table]]:text-sm",
  "[&_[data-streamdown=table-wrapper]_button_svg]:!w-3 [&_[data-streamdown=table-wrapper]_button_svg]:!h-3 [&_[data-streamdown=table-wrapper]_button]:p-0.5",
  "[&_[data-streamdown=table-wrapper]_.relative>div]:rounded-none [&_[data-streamdown=table-wrapper]_.relative>div]:shadow-sm [&_[data-streamdown=table-wrapper]_.relative>div>button]:text-xs [&_[data-streamdown=table-wrapper]_.relative>div>button]:px-2.5 [&_[data-streamdown=table-wrapper]_.relative>div>button]:py-1.5",
);

export function makeStreamdownComponents(
  onEntityLink: (href: string) => boolean,
): Record<string, React.FC<{ href?: string; children?: ReactNode }>> {
  return {
    a: ({ href, children }) => {
      if (href?.startsWith("#txn:") || href?.startsWith("#inv:")) {
        return (
          <button
            type="button"
            className="text-left hover:text-foreground transition-colors cursor-pointer"
            onClick={() => onEntityLink(href)}
          >
            {children}
          </button>
        );
      }
      return (
        <Link
          href={href || "#"}
          className="border-b border-dashed border-[#878787]/30 hover:text-foreground transition-colors"
        >
          {children}
        </Link>
      );
    },
    p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="space-y-1 pl-4">{children}</ul>,
    ol: ({ children }) => (
      <ol className="space-y-1 pl-4 list-decimal">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-sm leading-relaxed list-disc marker:text-muted-foreground/40">
        {children}
      </li>
    ),
    h1: ({ children }) => (
      <h1 className="text-sm font-medium text-foreground mt-3 mb-1">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-sm font-medium text-foreground mt-3 mb-1">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-medium text-muted-foreground mt-2 mb-0.5">
        {children}
      </h3>
    ),
    strong: ({ children }) => (
      <strong className="font-medium text-foreground">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="px-1 py-0.5 bg-secondary text-foreground text-[13px]">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="p-3 bg-secondary text-foreground text-[13px] overflow-x-auto">
        {children}
      </pre>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-border">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="border-b border-border">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="h-10 px-4 text-left align-middle text-[#666666] font-medium whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 align-middle whitespace-nowrap">{children}</td>
    ),
  };
}
