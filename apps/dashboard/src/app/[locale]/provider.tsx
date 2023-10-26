"use client";

import { I18nProviderClient } from "@/locales/client";
import { ReactNode } from "react";

type ProviderProps = {
  locale: string;
  children: ReactNode;
};

export function Provider({ locale, children }: ProviderProps) {
  return <I18nProviderClient locale={locale}>{children}</I18nProviderClient>;
}
