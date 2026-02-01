"use client";

import { useForesight } from "@/hooks/use-foresight";
import type { ForesightRegisterOptions } from "js.foresight";
import type { LinkProps } from "next/link";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">,
    Omit<ForesightRegisterOptions, "element" | "callback"> {
  children: React.ReactNode;
  className?: string;
}

/**
 * A Next.js Link component that uses ForesightJS for predictive prefetching.
 * Instead of prefetching when the link enters the viewport, this only prefetches
 * when the user's cursor trajectory indicates they're heading toward the link.
 *
 * This significantly reduces unnecessary data transfer for navigation menus.
 *
 * @see https://foresightjs.com/docs/react/nextjs/
 */
export function ForesightLink({
  children,
  className,
  ...props
}: ForesightLinkProps) {
  const router = useRouter();
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => {
      router.prefetch(props.href.toString());
    },
    hitSlop: props.hitSlop,
    name: props.name,
    meta: props.meta,
    reactivateAfter: props.reactivateAfter,
  });

  return (
    <Link {...props} ref={elementRef} className={className} prefetch={false}>
      {children}
    </Link>
  );
}
