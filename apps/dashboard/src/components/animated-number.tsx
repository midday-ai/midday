"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type Props = {
  value: number;
  currency: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
};

export function AnimatedNumber({
  value,
  currency,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
}: Props) {
  const trpc = useTRPC();
  // Use regular useQuery instead of useSuspenseQuery to allow it to fail gracefully
  // This is needed for public pages where user data isn't available
  const { data: user } = useQuery({
    ...trpc.user.me.queryOptions(),
    retry: false,
    // Don't throw errors - just return undefined if user isn't available
    throwOnError: false,
  });
  const localeToUse = locale || user?.locale;

  return (
    <NumberFlow
      value={value}
      format={{
        style: "currency",
        currency: currency ?? "USD",
        minimumFractionDigits,
        maximumFractionDigits,
      }}
      willChange
      locales={localeToUse ?? "en"}
    />
  );
}
