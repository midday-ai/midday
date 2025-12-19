"use client";

import dynamic from "next/dynamic";

// Dynamically load GlobalSheets - loads in background after initial render
// By the time user clicks to open a sheet, it's already loaded
const GlobalSheets = dynamic(
  () => import("./global-sheets").then((mod) => mod.GlobalSheets),
  { ssr: false },
);

export function GlobalSheetsProvider() {
  return <GlobalSheets />;
}
