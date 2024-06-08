"use client";

import { useI18n } from "@/locales/client";

export function TransactionMethod({ method }) {
  const t = useI18n();

  return t(`transaction_methods.${method}`);
}
