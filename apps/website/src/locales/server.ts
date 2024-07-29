import { createI18nServer } from "next-international/server";

// NOTE: Also update middleware.ts to support locale
export const languages = ["en"];

export const { getI18n, getScopedI18n, getStaticParams } = createI18nServer({
  en: () => import("./en"),
  sv: () => import("./sv"),
});
