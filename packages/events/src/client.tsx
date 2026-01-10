import {
  OpenPanelComponent,
  type TrackProperties,
  useOpenPanel,
} from "@openpanel/nextjs";

const isProd = process.env.NODE_ENV === "production";

const Provider = () => (
  <OpenPanelComponent
    clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
    trackAttributes={true}
    trackScreenViews={isProd}
    trackOutgoingLinks={isProd}
  />
);

const track = (options: { event: string } & TrackProperties) => {
  const { track: openTrack } = useOpenPanel();

  if (!isProd) {
    console.log("Track", options);
    return;
  }

  const { event, ...rest } = options;

  openTrack(event, rest);
};

export { Provider, track };
