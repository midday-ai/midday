"use client";

import { useChangeLocale } from "@/locales/client";

export function Switch() {
  const changeLocale = useChangeLocale({});

  return (
    <>
      <button type="button" onClick={() => changeLocale("en")}>
        English
      </button>
      <button type="button" onClick={() => changeLocale("sv")}>
        Svenska
      </button>
    </>
  );
}
