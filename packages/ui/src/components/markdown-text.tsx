"use client";

import { memo } from "react";
import { cn } from "../utils/cn";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import "katex/dist/katex.min.css";

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ node, className, ...props }) => (
          <h1
            className={cn(
              "mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0",
              className,
            )}
            {...props}
          />
        ),
        h2: ({ node, className, ...props }) => (
          <h2
            className={cn(
              "mb-4 mt-8 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0",
              className,
            )}
            {...props}
          />
        ),
        h3: ({ node, className, ...props }) => (
          <h3
            className={cn(
              "mb-4 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0",
              className,
            )}
            {...props}
          />
        ),
        h4: ({ node, className, ...props }) => (
          <h4
            className={cn(
              "mb-4 mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0",
              className,
            )}
            {...props}
          />
        ),
        h5: ({ node, className, ...props }) => (
          <h5
            className={cn(
              "my-4 text-lg font-semibold first:mt-0 last:mb-0",
              className,
            )}
            {...props}
          />
        ),
        h6: ({ node, className, ...props }) => (
          <h6
            className={cn("my-4 font-semibold first:mt-0 last:mb-0", className)}
            {...props}
          />
        ),
        p: ({ node, className, ...props }) => (
          <p
            className={cn(
              "mb-5 mt-5 leading-7 first:mt-0 last:mb-0",
              className,
            )}
            {...props}
          />
        ),
        a: ({ node, ...props }) => (
          <a
            target="_blank"
            className={cn(
              "font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50",
              props.className,
            )}
            {...props}
          />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            className={cn("border-l-2 pl-6 italic", props.className)}
            {...props}
          />
        ),
        ul: ({ node, ...props }) => (
          <ul
            className={cn("my-5 ml-6 list-disc [&>li]:mt-2", props.className)}
            {...props}
          />
        ),
        ol: ({ node, ...props }) => (
          <ol
            className={cn(
              "my-5 ml-6 list-decimal [&>li]:mt-2",
              props.className,
            )}
            {...props}
          />
        ),
        hr: ({ node, ...props }) => (
          <hr className={cn("my-5 border-b", props.className)} {...props} />
        ),

        table: ({ node, ...props }) => (
          <table
            className={cn(
              "my-5 w-full border-separate border-spacing-0 overflow-y-auto",
              props.className,
            )}
            {...props}
          />
        ),
        th: ({ node, ...props }) => (
          <th
            className={cn(
              "bg-zinc-100 px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg dark:bg-zinc-800 [&[align=center]]:text-center [&[align=right]]:text-right",
              props.className,
            )}
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td
            className={cn(
              "border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right",
              props.className,
            )}
            {...props}
          />
        ),
        tr: ({ node, ...props }) => (
          <tr
            className={cn(
              "m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
              props.className,
            )}
            {...props}
          />
        ),

        sup: ({ node, ...props }) => (
          <sup
            className={cn("[&>a]:text-xs [&>a]:no-underline", props.className)}
            {...props}
          />
        ),
        code(props) {
          const { children, className, node, ref, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "")?.[1];
          return (
            <>
              <div className="rounded-t-lg bg-zinc-100 px-4 py-2 font-mono text-xs dark:bg-zinc-800">
                <p>{match}</p>
              </div>
              <code
                {...rest}
                className={cn(
                  "overflow-x-auto rounded-b-lg bg-background p-4 text-foreground",
                  className,
                )}
              >
                {children}
              </code>
            </>
          );
        },
      }}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);
