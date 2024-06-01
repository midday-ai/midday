import {
  OpenpanelProvider,
  type PostEventPayload,
  setProfile,
  trackEvent,
} from "@openpanel/nextjs";

const Provider = () => (
  <OpenpanelProvider
    clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
    trackScreenViews={true}
    trackAttributes={true}
    trackOutgoingLinks={true}
  />
);

const track = (options: { event: string } & PostEventPayload["properties"]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Track", options);
    return;
  }

  const { event, ...rest } = options;

  trackEvent(event, rest);
};

export { Provider, track, setProfile };
