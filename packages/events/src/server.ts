import { OpenPanel, type TrackProperties } from "@openpanel/nextjs";

export const setupAnalytics = async () => {
  const client = new OpenPanel({
    clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_SECRET_KEY!,
  });

  return {
    track: (options: { event: string } & TrackProperties) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("Track", options);
        return;
      }

      const { event, ...rest } = options;

      client.track(event, rest).catch(() => {});
    },
  };
};
