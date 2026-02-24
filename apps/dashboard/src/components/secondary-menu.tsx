"use client";

import { cn } from "@midday/ui/cn";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

type Item = {
  path: string;
  label: string;
};

type Props = {
  items: Item[];
};

export function SecondaryMenu({ items }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handlePrefetch = useCallback(
    (path: string) => {
      router.prefetch(path);
    },
    [router],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      for (const item of items) {
        if (item.path !== pathname) {
          router.prefetch(item.path);
        }
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router, items, pathname]);

  return (
    <nav className="py-4">
      <ul className="flex space-x-6 text-sm overflow-auto scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            prefetch={false}
            onMouseEnter={() => handlePrefetch(item.path)}
            className={cn(
              "text-[#606060]",
              pathname === item.path &&
                "text-primary font-medium underline underline-offset-8",
            )}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </ul>
    </nav>
  );
}
