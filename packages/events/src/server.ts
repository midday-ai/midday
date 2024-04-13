import { LogSnag } from "@logsnag/next/server";
import { cookies } from "next/headers";

type Props = {
  userId?: string;
  fullName: string;
};

interface TrackOptions {
  channel: string;
  event: string;
  description?: string;
  user_id?: string;
  icon?: string;
  tags?: Record<string, string | number | boolean>;
}

export const setupLogSnag = async (options: Props) => {
  const { userId, fullName } = options ?? {};
  const trackingConsent = cookies().get("tracking-consent")?.value === "0";

  const logsnag = new LogSnag({
    token: process.env.LOGSNAG_PRIVATE_TOKEN!,
    project: process.env.NEXT_PUBLIC_LOGSNAG_PROJECT!,
    disableTracking: Boolean(process.env.NEXT_PUBLIC_LOGSNAG_DISABLED!),
  });

  if (trackingConsent && userId) {
    await logsnag.identify({
      user_id: userId,
      properties: {
        name: fullName,
      },
    });
  }

  return {
    ...logsnag,
    track: (options: TrackOptions) =>
      logsnag.track({
        ...options,
        user_id: trackingConsent ? userId : undefined,
      }),
  };
};
