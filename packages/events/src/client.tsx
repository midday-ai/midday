import {
  OpenpanelProvider,
  type PostEventPayload,
  setProfile,
  trackEvent,
} from "@openpanel/nextjs";

const isProd = process.env.NODE_ENV === "production";

const Provider = () => (
  <OpenpanelProvider
    clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
    trackAttributes={true}
    trackScreenViews={isProd}
    trackOutgoingLinks={isProd}
  />
);

const track = (options: { event: string } & PostEventPayload["properties"]) => {
  if (!isProd) {
    console.log("Track", options);
    return;
  }

  const { event, ...rest } = options;

  trackEvent(event, rest);
};

export { Provider, track, setProfile };
