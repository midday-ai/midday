import { cn } from "@midday/ui/cn";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { highlight } from "sugar-high";

function slugify(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    const slug = slugify(children as string);
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;

    return (
      <Tag id={slug} className="group relative scroll-mt-24">
        <a
          href={`#${slug}`}
          className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          aria-label={`Link to ${children}`}
        >
          #
        </a>
        {children}
      </Tag>
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}

interface CustomLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

function CustomLink({ href, children, ...props }: CustomLinkProps) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  const isAnchor = href.startsWith("#");

  if (isAnchor) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  if (isInternal) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

interface CodeProps {
  children: string;
  className?: string;
}

function InlineCode({ children, className, ...props }: CodeProps) {
  // Check if this is a code block (has language class) or inline code
  if (className?.includes("language-")) {
    const codeHTML = highlight(children);
    return (
      <code
        className={className}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Syntax highlighting requires innerHTML
        dangerouslySetInnerHTML={{ __html: codeHTML }}
        {...props}
      />
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre className="overflow-x-auto" {...props}>
      {children}
    </pre>
  );
}

interface ImageProps extends React.ComponentProps<typeof Image> {
  alt: string;
}

function DocImage(props: ImageProps) {
  return (
    <span className="block my-8">
      <Image className="w-full" {...props} />
    </span>
  );
}

function Blockquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-border pl-4 my-6 text-muted-foreground italic">
      {children}
    </blockquote>
  );
}

function Hr() {
  return <hr className="my-12 border-border" />;
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return <ol className="my-4 ml-4 list-decimal space-y-2">{children}</ol>;
}

function UnorderedList({ children }: { children: React.ReactNode }) {
  return <ul className="my-4 ml-4 list-disc space-y-2">{children}</ul>;
}

function ListItem({ children }: { children: React.ReactNode }) {
  return <li className="pl-1">{children}</li>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="my-4 leading-7">{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

interface TableProps {
  children: React.ReactNode;
}

function Table({ children }: TableProps) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border">{children}</thead>;
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

function TableRow({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-3 pr-4 text-left font-medium text-foreground">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pr-4 text-muted-foreground">{children}</td>;
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  a: CustomLink,
  code: InlineCode,
  pre: Pre,
  Image: DocImage,
  img: DocImage,
  blockquote: Blockquote,
  hr: Hr,
  ol: OrderedList,
  ul: UnorderedList,
  li: ListItem,
  p: Paragraph,
  strong: Strong,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  th: TableHeader,
  td: TableCell,
};

interface DocsMDXProps {
  source: string;
}

export function DocsMDX({ source }: DocsMDXProps) {
  return (
    <div
      className={cn(
        // Base text
        "text-muted-foreground",
        // Headings
        "[&>h1]:text-3xl [&>h1]:font-serif [&>h1]:text-foreground [&>h1]:tracking-tight [&>h1]:mt-0 [&>h1]:mb-6",
        "[&>h2]:text-xl [&>h2]:font-serif [&>h2]:text-foreground [&>h2]:tracking-tight [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:pt-6 [&>h2]:border-t [&>h2]:border-border first:[&>h2]:mt-0 first:[&>h2]:pt-0 first:[&>h2]:border-t-0",
        "[&>h3]:text-lg [&>h3]:font-serif [&>h3]:text-foreground [&>h3]:tracking-tight [&>h3]:mt-8 [&>h3]:mb-3",
        "[&>h4]:text-base [&>h4]:font-medium [&>h4]:text-foreground [&>h4]:mt-6 [&>h4]:mb-2",
        // Links
        "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-border hover:[&_a]:decoration-foreground [&_a]:transition-colors",
        // Code
        "[&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-foreground",
        "[&_pre]:bg-secondary [&_pre]:border [&_pre]:border-border [&_pre]:p-4 [&_pre]:my-6",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
      )}
    >
      <MDXRemote source={source} components={components} />
    </div>
  );
}
