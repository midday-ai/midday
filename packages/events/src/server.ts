import { OpenpanelSdk, type PostEventPayload } from "@openpanel/nextjs";
import { waitUntil } from "@vercel/functions";
import { cookies } from "next/headers";

type Props = {
  userId?: string;
  fullName?: string | null;
};

export const setupAnalytics = async (options?: Props) => {
  const { userId, fullName } = options ?? {};
  const trackingConsent = cookies().get("tracking-consent")?.value === "0";

  const client = new OpenpanelSdk({
    clientId: "{YOUR_CLIENT_ID}",
    clientSecret: "{YOUR_CLIENT_SECRET}",
  });

  if (trackingConsent && userId && fullName) {
    const [firstName, lastName] = fullName.split(" ");

    waitUntil(
      client.setProfile({
        profileId: userId,
        firstName,
        lastName,
      })
    );
  }

  return {
    // ...logsnag,
    track: (options: { event: string } & PostEventPayload["properties"]) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Track", options);
        return;
      }

      const { event, ...rest } = options;

      waitUntil(client.event(event, rest));
    },
  };
};
