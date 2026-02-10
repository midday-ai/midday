import { cn } from "@midday/ui/cn";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type {
  AnchorHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  ReactNode,
} from "react";
import remarkGfm from "remark-gfm";
import { highlight } from "sugar-high";

function slugify(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

function createHeading(level: number) {
  const Heading = ({ children }: { children: ReactNode }) => {
    const slug = slugify(children as string);
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;

    return (
      <Tag id={slug} className="group flex items-baseline scroll-mt-24">
        <a
          href={`#${slug}`}
          className="-ml-5 w-5 -mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          aria-label={`Link to ${children}`}
        >
          #
        </a>
        <span>{children}</span>
      </Tag>
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}

interface CustomLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
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

function Pre({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  return (
    <pre className="overflow-x-auto" {...props}>
      {children}
    </pre>
  );
}

interface ImageProps extends ComponentProps<typeof Image> {
  alt: string;
}

function DocImage(props: ImageProps) {
  return (
    <span className="block my-8">
      <Image className="w-full" {...props} />
    </span>
  );
}

function Blockquote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-l-2 border-border pl-4 my-6 text-muted-foreground italic">
      {children}
    </blockquote>
  );
}

function Hr() {
  return <hr className="my-12 border-border" />;
}

function OrderedList({ children }: { children: ReactNode }) {
  return <ol className="my-4 ml-4 list-decimal space-y-2">{children}</ol>;
}

function UnorderedList({ children }: { children: ReactNode }) {
  return <ul className="my-4 ml-4 list-disc space-y-2">{children}</ul>;
}

function ListItem({ children }: { children: ReactNode }) {
  return <li className="pl-1">{children}</li>;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="my-4 leading-7">{children}</p>;
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

interface TableProps {
  children: ReactNode;
}

function Table({ children }: TableProps) {
  return (
    <div className="my-6 overflow-x-auto border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-secondary/50 border-b border-border">{children}</thead>
  );
}

function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

function TableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="hover:bg-secondary/30 transition-colors">{children}</tr>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-medium text-foreground whitespace-nowrap">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 text-muted-foreground">{children}</td>;
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
        "[&_code]:bg-[#f5f5f5] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-foreground [&_code]:rounded-none dark:[&_code]:bg-secondary",
        "[&_pre]:bg-[#fafafa] [&_pre]:border [&_pre]:border-border [&_pre]:p-4 [&_pre]:my-6 [&_pre]:rounded-none dark:[&_pre]:bg-[#0c0c0c]",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none",
      )}
    >
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </div>
  );
}
