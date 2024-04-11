import { LogSnag } from "@logsnag/next/server";
import { cookies } from "next/headers";

type Props = {
  userId: string;
  fullName: string;
};

export const setupLogSnag = async ({ userId, fullName }: Props) => {
  const trackingConsent = cookies().get("tracking-consent")?.value === "0";

  const logsnag = new LogSnag({
    token: process.env.LOGSNAG_PRIVATE_TOKEN!,
    project: process.env.NEXT_PUBLIC_LOGSNAG_PROJECT!,
    disableTracking: Boolean(process.env.NEXT_PUBLIC_LOGSNAG_DISABLED!),
  });

  if (trackingConsent) {
    await logsnag.identify({
      user_id: userId,
      properties: {
        name: fullName,
      },
    });
  }

  return logsnag;
};
