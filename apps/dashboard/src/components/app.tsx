import { disconnectAppAction } from "@/actions/disconnect-app-action";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { AppSettings } from "./app-settings";

export function App({
  id,
  logo: Logo,
  name,
  short_description,
  description,
  settings,
  onInitialize,
  images,
  active,
  installed,
  category,
  userSettings,
}: {
  id: string;
  logo: React.ComponentType;
  name: string;
  short_description: string;
  description: string;
  settings: Record<string, any>;
  onInitialize: () => void;
  images: string[];
  active?: boolean;
  installed?: boolean;
  category: string;
  userSettings: Record<string, any>;
}) {
  const [params, setParams] = useQueryStates({
    app: parseAsString,
    settings: parseAsBoolean,
  });

  const [isLoading, setLoading] = useState(false);
  const disconnectApp = useAction(disconnectAppAction);

  const handleDisconnect = () => {
    disconnectApp.execute({ appId: id });
  };

  const handleOnInitialize = async () => {
    setLoading(true);
    await onInitialize();
    setLoading(false);
  };

  return (
    <Card key={id} className="w-full flex flex-col">
      <Sheet open={params.app === id} onOpenChange={() => setParams(null)}>
        <div className="pt-6 px-6 h-16 flex items-center justify-between">
          <Logo />

          {installed && (
            <div className="text-green-600 bg-green-100 text-[10px] dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full font-mono">
              Installed
            </div>
          )}
        </div>

        <CardHeader className="pb-0">
          <div className="flex items-center space-x-2 pb-4">
            <CardTitle className="text-md font-medium leading-none p-0 m-0">
              {name}
            </CardTitle>
            {!active && (
              <span className="text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D] px-3 py-1 rounded-full font-mono">
                Coming soon
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-xs text-[#878787] pb-4">
          {short_description}
        </CardContent>

        <div className="px-6 pb-6 flex gap-2 mt-auto">
          <Button
            variant="outline"
            className="w-full"
            disabled={!active}
            onClick={() => setParams({ app: id })}
          >
            Details
          </Button>

          {installed ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDisconnect}
            >
              {disconnectApp.status === "executing"
                ? "Disconnecting..."
                : "Disconnect"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleOnInitialize}
              disabled={!onInitialize || !active || isLoading}
            >
              Install
            </Button>
          )}
        </div>

        <SheetContent>
          <SheetHeader>
            <div className="mb-4">
              <Image
                src={images[0]}
                alt={name}
                width={465}
                height={290}
                quality={100}
              />
            </div>

            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center space-x-2">
                <Logo />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg leading-none">{name}</h3>
                    {installed && (
                      <div className="bg-green-600 text-[9px] dark:bg-green-300 rounded-full size-1" />
                    )}
                  </div>

                  <span className="text-xs text-[#878787]">
                    {category} • Published by Midday
                  </span>
                </div>
              </div>

              <div>
                {installed ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDisconnect}
                  >
                    {disconnectApp.status === "executing"
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-primary"
                    onClick={handleOnInitialize}
                    disabled={!onInitialize || !active || isLoading}
                  >
                    Install
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-530px)] pt-2" hideScrollbar>
            <Accordion
              type="multiple"
              defaultValue={[
                "description",
                ...(params.settings ? ["settings"] : []),
              ]}
              className="mt-4"
            >
              <AccordionItem value="description" className="border-none">
                <AccordionTrigger>How it works</AccordionTrigger>
                <AccordionContent className="text-[#878787] text-sm">
                  {description}
                </AccordionContent>
              </AccordionItem>

              {settings && (
                <AccordionItem value="settings" className="border-none">
                  <AccordionTrigger>Settings</AccordionTrigger>
                  <AccordionContent className="text-[#878787] text-sm">
                    <AppSettings
                      appId={id}
                      settings={[
                        ...Object.values({
                          ...Object.fromEntries(
                            (Array.isArray(settings) ? settings : []).map(
                              (setting) => [setting.id, setting],
                            ),
                          ),
                          ...Object.fromEntries(
                            (Array.isArray(userSettings)
                              ? userSettings
                              : []
                            ).map((setting) => [setting.id, setting]),
                          ),
                        }),
                      ]}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </ScrollArea>

          <div className="absolute bottom-4 pt-8 border-t border-border">
            <p className="text-[10px] text-[#878787]">
              All apps on the Midday App Store are open-source and
              peer-reviewed. Midday Labs AB maintains high standards but doesn't
              endorse third-party apps. Apps published by Midday are officially
              certified. Report any concerns about app content or behavior.
            </p>

            <a
              href="mailto:support@midday.dev"
              className="text-[10px] text-red-500"
            >
              Report app
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
