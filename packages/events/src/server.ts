import { OpenPanel, type PostEventPayload } from "@openpanel/nextjs";
import { waitUntil } from "@vercel/functions";

export const setupAnalytics = async () => {
  const client = new OpenPanel({
    clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_SECRET_KEY!,
  });

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
