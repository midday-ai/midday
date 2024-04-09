"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

type Props = {
  firstPost: boolean;
  slug: string;
};

export function ArticleInView({ slug, firstPost }: Props) {
  const { ref, inView } = useInView();

  const pathname = usePathname();
  const fullSlug = `/updates/${slug}`;

  useEffect(() => {
    if (inView && pathname !== fullSlug) {
      window.history.pushState({ urlPath: fullSlug }, "", fullSlug);
    }
  }, [inView, fullSlug, firstPost]);

  return <div ref={ref} />;
}
