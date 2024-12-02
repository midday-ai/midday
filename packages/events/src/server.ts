import { OpenPanel, type PostEventPayload } from "@openpanel/nextjs";
import { waitUntil } from "@vercel/functions";
import { cookies } from "next/headers";

type Props = {
  userId?: string;
  fullName?: string | null;
};

export const setupAnalytics = async (options?: Props) => {
  const { userId, fullName } = options ?? {};
  const trackingConsent =
    !cookies().has("tracking-consent") ||
    cookies().get("tracking-consent")?.value === "1";

  const client = new OpenPanel({
    clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_SECRET_KEY!,
  });

  if (trackingConsent && userId && fullName) {
    const [firstName, lastName] = fullName.split(" ");

    waitUntil(
      client.identify({
        profileId: userId,
        firstName,
        lastName,
      }),
    );
  }

  return {
    track: (options: { event: string } & PostEventPayload["properties"]) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Track", options);
        return;
      }

      const { event, ...rest } = options;

      waitUntil(client.track(event, rest));
    },
  };
};
