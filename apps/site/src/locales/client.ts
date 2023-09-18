import { createI18nClient } from "next-international/client";

export const { useI18n, useScopedI18n, I18nProviderClient, useChangeLocale } =
  createI18nClient({
    en: () => import("./en"),
    sv: () => import("./sv"),
  });
