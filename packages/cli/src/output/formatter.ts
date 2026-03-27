import { getConfig } from "../config/store.js";
import { isTTY } from "../utils/env.js";

export type OutputFormat = "json" | "table";

export interface GlobalFlags {
  json?: boolean;
  table?: boolean;
  agent?: boolean;
  quiet?: boolean;
  noInput?: boolean;
  yes?: boolean;
  dryRun?: boolean;
  apiUrl?: string;
  debug?: boolean;
}

export function resolveFormat(flags: GlobalFlags): OutputFormat {
  if (flags.agent || flags.json) return "json";
  if (flags.table) return "table";

  const config = getConfig();
  if (config.defaultFormat) return config.defaultFormat;

  return isTTY() ? "table" : "json";
}
