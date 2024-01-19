import { LogSnag } from "@logsnag/next/server";

export const logsnag = new LogSnag({
  token: process.env.LOGSNAG_PRIVATE_TOKEN!,
  project: process.env.NEXT_PUBLIC_LOGSNAG_PROJECT!,
  disableTracking: Boolean(process.env.LOGSNAG_DISABLE!),
});
