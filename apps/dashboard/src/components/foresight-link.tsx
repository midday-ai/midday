"use client";

import type { ForesightRegisterOptions } from "js.foresight";
import type { LinkProps } from "next/link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForesight } from "@/hooks/use-foresight";

// Default hitSlop extends the detection area around links
// This triggers prefetch earlier when cursor is heading toward a link
const DEFAULT_HIT_SLOP = { top: 50, right: 50, bottom: 50, left: 50 };

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
  // Destructure Foresight-specific props to prevent them from being passed to Link/DOM
  hitSlop,
  name,
  meta,
  reactivateAfter,
  ...linkProps
}: ForesightLinkProps) {
  const router = useRouter();

  // Memoize href string to ensure stable dependency for useCallback
  // (href can be a UrlObject, so we convert to string for comparison)
  const hrefString = linkProps.href.toString();

  const handlePrefetch = useCallback(() => {
    router.prefetch(hrefString);
  }, [router, hrefString]);

  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: handlePrefetch,
    hitSlop: hitSlop ?? DEFAULT_HIT_SLOP,
    name,
    meta,
    reactivateAfter,
  });

  return (
    <Link
      {...linkProps}
      ref={elementRef}
      className={className}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
