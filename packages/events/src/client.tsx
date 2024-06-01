import { OpenpanelProvider, setProfile, trackEvent } from "@openpanel/nextjs";

const Provider = () => (
  <OpenpanelProvider
    url="https://api.openpanel.dev"
    clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
    trackScreenViews={true}
    trackAttributes={true}
    trackOutgoingLinks={true}
  />
);

export { Provider, trackEvent, setProfile };
