import AppConfigDetail from "@/components/apps-config-detail";
import AppsDeveloperDetail from "@/components/apps-developer-detail";
import DisconnectAppButton from "@/components/buttons/apps/disconnect-app-button";
import InstallAppButton from "@/components/buttons/apps/install-apps";
import { ContentLayout } from "@/components/panel/content-layout";
import { PortalViewWrapper } from "@/components/portal-views/portal-view-wrapper";
import config from "@/config";
import { getAppsMap } from "@midday/app-store";
import { IntegrationCategory } from "@midday/app-store/types";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { Button } from "@midday/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@midday/ui/carousel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations | Solomon AI",
};

export default async function Page({
  params,
  searchParams,
}: {
  params: { appid: string };
  searchParams: Record<string, string>;
}) {
  const supabase = createClient();

  const res = await getUser();
  const name = res?.data?.full_name as string;
  const userId = res?.data?.id as string;
  const teamId = res?.data?.team_id as string;

  // fetch all apps the user has installed
  const { data } = await supabase
    .from("apps")
    .select("app_id, settings")
    .eq("team_id", teamId);

  // flatten the apps array
  const appsMap = getAppsMap();

  // extract the app of interest based on the appid
  const app = appsMap[params.appid];

  // if the app is not found, return a 404
  if (!app) {
    return (
      <ContentLayout title="Integrations">
        <PortalViewWrapper
          title={`${config.company} Integration`}
          description="Connect business-critical integrations to Solomon AI"
          subtitle=""
          disabled={false}
          className="w-full border-none py-[2%] px-[0.5%] shadow-none"
        >
          <p>The App you are looking for does not exist. </p>
        </PortalViewWrapper>
      </ContentLayout>
    );
  }

  // we check if the app is currently installed for the given user
  const isAppInstalled =
    data?.some((installedApp) => installedApp.app_id === params.appid) ?? false;

  // TODO: based on the type of integration, we want to query the backend for income and expense metrics and enable the end user to perform some degree of stress test on this

  // Prepare the config object for AppConfigDetail
  const appConfigForDetail = {
    name: app.name,
    id: app.id,
    category: app.category,
    active: app.active,
    logoUrl: typeof app.logo === "string" ? app.logo : "",
    short_description: app.short_description,
    description: app.description,
    images: app.images,
    settings: app.settings,
    config: app.config,
    equation: app.equation,
    model_type: app.model_type,
    api_version: app.api_version,
    is_public: app.is_public,
    tags: app.tags,
    integration_type: app.integration_type,
    webhook_url: app.webhook_url,
    supported_features: app.supported_features,
    last_sync_at: app.last_sync_at,
    sync_status: app.sync_status,
    auth_method: app.auth_method,
  };

  return (
    <ContentLayout title="Integrations">
      <PortalViewWrapper
        title={`${config.name} Integration`}
        description={`${app.short_description}`}
        subtitle=""
        disabled={false}
        className="w-full border-none py-[2%] px-[0.5%] shadow-none"
      >
        {/** high level app details */}
        <div className="flex flex-1 justify-between py-[4%]">
          <div className="flex flex-1 gap-5">
            {typeof app.logo === "function" ? (
              <app.logo className="w-24 h-24 border rounded-full" />
            ) : (
              <img
                src={app.logo}
                alt={app.name}
                className="w-24 h-24 border rounded-full"
              />
            )}
            <h3 className="text-2xl md:text-5xl font-bold">{app.name}</h3>
            <Button variant={"outline"}>{app.category}</Button>
          </div>
          <div>
            {isAppInstalled ? (
              <DisconnectAppButton appId={app.id} appName={app.name} />
            ) : (
              <InstallAppButton
                id={app.id}
                installed={isAppInstalled}
                category={app.category}
                active={app.active}
              />
            )}
          </div>
        </div>

        {/** Disclose the images if present */}
        {app.images && app.images.length > 1 && (
          <Carousel
            className="flex flex-col"
            opts={{
              align: "start",
            }}
          >
            <div className="ml-auto hidden md:flex">
              <CarouselPrevious className="static p-0 border-none hover:bg-transparent" />
              <CarouselNext className="static p-0 border-none hover:bg-transparent" />
            </div>

            <CarouselContent className="-ml-[20px] 2xl:-ml-[40px] flex-col md:flex-row space-y-6 md:space-y-0">
              {app.images.map((item, idx) => {
                return (
                  <CarouselItem
                    className="lg:basis-1/2 xl:basis-1/3 3xl:basis-1/4 pl-[20px] 2xl:pl-[40px] md:min-h-[300px]"
                    key={idx.toString()}
                  >
                    <img src={item} alt={app.name} />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        )}

        {/** main sections of the page of interest */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="col-span-3">
            <AppConfigDetail
              config={{
                ...appConfigForDetail,
                onInitialize: app.onInitialize,
              }}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2 p-[2%]">
            <AppsDeveloperDetail
              config={{
                company: config.company,
                webUrl: config.webUrl,
                documentationUrl: config.documentationUrl,
                termsAndConditionsUrl: config.termsAndConditionsUrl,
                privacyPolicyUrl: config.privacyPolicyUrl,
              }}
            />
          </div>
        </div>

        {/** The actual  */}
      </PortalViewWrapper>
    </ContentLayout>
  );
}
