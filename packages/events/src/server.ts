import { LogSnag } from "@logsnag/next/server";
import { cookies } from "next/headers";

export const setupLogSnag = () => {
  const disableTracking =
    cookies().get("tracking-consent")?.value === "0" ||
    Boolean(process.env.NEXT_PUBLIC_LOGSNAG_DISABLED!);

  return new LogSnag({
    token: process.env.LOGSNAG_PRIVATE_TOKEN!,
    project: process.env.NEXT_PUBLIC_LOGSNAG_PROJECT!,
    disableTracking,
  });
};
