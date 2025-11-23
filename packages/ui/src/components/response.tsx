"use client";

import { getAppUrl } from "@midday/utils/envs";
import Link from "next/link";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "../utils";
import { Table } from "./table";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Custom ul component with customizable className
const CustomUnorderedList = ({
  node,
  children,
  className,
  ...props
}: {
  node?: any;
  children?: React.ReactNode;
  className?: string;
}) => (
  <ul className={cn("list-none m-0 p-0 leading-relaxed", className)} {...props}>
    {children}
  </ul>
);

// Custom ol component with customizable className (no numbers)
const CustomOrderedList = ({
  node,
  children,
  className,
  ...props
}: {
  node?: any;
  children?: React.ReactNode;
  className?: string;
}) => (
  <ol
    className={cn("list-none m-0 p-0 leading-relaxed", className)}
    {...props}
    data-streamdown="unordered-list"
  >
    {children}
  </ol>
);

// Custom li component to remove padding
const CustomListItem = ({
  node,
  children,
  className,
  ...props
}: {
  node?: any;
  children?: React.ReactNode;
  className?: string;
}) => (
  <li
    className={cn("py-0 my-0 leading-relaxed", className)}
    {...props}
    data-streamdown="list-item"
  >
    {children}
  </li>
);

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-4 [&>h3+ul]:!mt-2 [&>h3+ol]:!mt-2 [&>h4+ul]:!mt-2 [&>h4+ol]:!mt-2 [&>ul]:!my-0 [&>ul]:!-mt-4 [&>*+ul]:!mt-2 [&>ol]:!my-0 [&>ol]:!-mt-4 [&>*+ol]:!mt-2",
        className,
      )}
      components={{
        ul: (props) => <CustomUnorderedList {...props} />,
        ol: (props) => <CustomOrderedList {...props} />,
        li: (props) => <CustomListItem {...props} />,
        h2: ({ children, node, ...props }) => (
          <h3
            className="font-medium text-sm text-primary tracking-wide"
            {...props}
          >
            {children}
          </h3>
        ),
        h3: ({ children, node, ...props }) => (
          <h3
            className="font-medium text-sm text-primary tracking-wide"
            {...props}
          >
            {children}
          </h3>
        ),
        h4: ({ children, node, ...props }) => (
          <h4
            className="font-medium text-sm text-primary tracking-wide"
            {...props}
          >
            {children}
          </h4>
        ),
        p: ({ children, ...props }) => (
          <p className="leading-relaxed" {...props}>
            {children}
          </p>
        ),
        table: (props) => (
          <div className="relative overflow-x-auto">
            <Table {...props} className="border" />
          </div>
        ),
        a: (props) => {
          // if the href starts with the app url, open in the same window
          if (props.href?.startsWith(getAppUrl())) {
            return (
              <Link href={props.href} className="underline">
                {props.children}
              </Link>
            );
          }

          return <a {...props} />;
        },
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = "Response";
