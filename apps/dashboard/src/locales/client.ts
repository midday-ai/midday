"use client";
import { createI18nClient } from "next-international/client";

export const languages = ["en", "sv"];

export const {
  useI18n,
  useScopedI18n,
  I18nProviderClient,
  useCurrentLocale,
  useChangeLocale,
} = createI18nClient({
  en: () => import("./en"),
  sv: () => import("./sv"),
});
