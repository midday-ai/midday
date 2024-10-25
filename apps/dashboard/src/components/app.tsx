import { disconnectAppAction } from "@/actions/disconnect-app-action";
import config from "@/config";
import { capitalize } from "@/utils/utils";
import {
  EquationConfig,
  IntegrationCategory,
  IntegrationConfig,
} from "@midday/app-store/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import {
  Cloud,
  Github,
  GlobeIcon,
  Keyboard,
  LifeBuoy,
  Mail,
  MessageSquare,
  MoreVertical,
  Plus,
  PlusCircle,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { AppSettings } from "./app-settings";
import { Equation } from "./equation";
import { AppsModellingModal } from "./modals/apps/app-modeling-modal";

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
  equation,
  cfg,
}: {
  id: string;
  logo: React.ComponentType;
  name: string;
  short_description: string;
  description: string;
  settings: Record<string, any>;
  onInitialize: (callback?: () => void) => void;
  images: string[];
  active?: boolean;
  installed?: boolean;
  category: IntegrationCategory;
  userSettings: Record<string, any>;
  equation?: EquationConfig;
  cfg: IntegrationConfig;
}) {
  const [params, setParams] = useQueryStates({
    app: parseAsString,
    settings: parseAsBoolean,
  });

  const [isLoading, setLoading] = useState(false);
  const disconnectApp = useAction(disconnectAppAction);

  const [isModellingDialogOpen, setIsModellingDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDisconnect = () => {
    disconnectApp.execute({ appId: id });
  };

  const handleOnInitialize = () => {
    setLoading(true);
    try {
      if (
        category === IntegrationCategory.Modelling ||
        category === IntegrationCategory.GoalTemplates
      ) {
        onInitialize(() => {
          setIsModellingDialogOpen(true);
        });
      } else {
        onInitialize(() => {
          console.log("Non-modelling initialization completed");
        });
      }
    } catch (error) {
      toast({
        duration: 2500,
        variant: "error",
        title: "There was an error installing the app.",
        description: error instanceof Error ? error.message : String(error),
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModellingConfirm = async () => {
    setLoading(false);
  };

  return (
    <Card key={id} className="w-full flex flex-col">
      <Sheet open={params.app === id} onOpenChange={() => setParams(null)}>
        <div className="pt-6 px-6 h-16 flex items-center justify-between">
          <Logo />

          <div className="flex">
            {installed && (
              <div className="text-green-600 bg-green-100 text-[14px] dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full font-mono">
                Installed
              </div>
            )}

            <AppSelectorMenu
              appId={id}
              installed={installed}
              isActive={active}
              appName={name}
              detailsCallback={() =>
                setParams({
                  app: id,
                })
              }
            />
          </div>
        </div>

        <CardHeader className="pb-0">
          <div className="flex items-center space-x-2 pb-4">
            <CardTitle className="text-md font-medium leading-none p-0 m-0">
              {name}
            </CardTitle>
            {category && (
              <span className="text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D] px-3 py-1 rounded-full font-mono">
                {capitalize(category)}
              </span>
            )}
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
            disabled={false}
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
              <div
                className="flex flex-col gap-3 items-center justify-center border-b border-border pb-2  h-[290px] w-[465px]"
                style={{
                  background: `linear-gradient(to right, var(--gray-100), var(--black))`,
                }}
              >
                <Badge>Integrations • {capitalize(category)}</Badge>
                <div className="md:text-5xl font-bold text-foreground">
                  {capitalize(name)}
                </div>
              </div>
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
                    {capitalize(category)} • Published by {config.company}
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
              {equation && (
                <AccordionItem value="equation" className="border-none">
                  <AccordionTrigger>Equation</AccordionTrigger>
                  <AccordionContent className="text-[#878787] text-sm">
                    <Equation config={equation} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {settings && (
                <AccordionItem value="settings" className="border-none">
                  <AccordionTrigger>Settings</AccordionTrigger>
                  <AccordionContent className="text-[#878787] text-sm">
                    <AppSettings
                      appId={id}
                      settings={
                        [
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
                        ] as any
                      }
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </ScrollArea>

          <div className="absolute bottom-4 pt-8 border-t border-border">
            <p className="text-[10px] text-[#878787]">
              All integrations on the {config.company} platform are open-source
              and peer-reviewed. {config.company} maintains high standards but
              doesn't endorse third-party apps. Apps published by{" "}
              {config.company}
              are officially certified. Report any concerns about app content
              certified. Report any concerns about app content or behavior.
            </p>

            <a
              href="mailto:engineering@solomon-ai.co"
              className="text-[10px] text-red-500"
            >
              Report app
            </a>
          </div>
        </SheetContent>
      </Sheet>

      {/** This modal is only to be used to enable connection of models or goal templates to a user account */}
      <AppsModellingModal
        isOpen={isModellingDialogOpen}
        onClose={() => setIsModellingDialogOpen(false)}
        appType={
          category as
            | IntegrationCategory.GoalTemplates
            | IntegrationCategory.Modelling
        }
        id={id}
        installed={installed || false}
        cfg={cfg}
      />
    </Card>
  );
}

interface AppSelectorMenuProps {
  appId: string;
  installed?: boolean;
  isActive?: boolean;
  appName: string;
  detailsCallback?: () => void;
}

const AppSelectorMenu: React.FC<AppSelectorMenuProps> = ({
  appName,
  appId,
  installed,
  detailsCallback,
}: AppSelectorMenuProps) => {
  const disconnectApp = useAction(disconnectAppAction);

  const handleDisconnect = () => {
    disconnectApp.execute({ appId: appId });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{appName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/** place to the integration page if clicked */}
          <Link href={`/apps/${appId}`} passHref legacyBehavior>
            <DropdownMenuItem>
              <GlobeIcon className="mr-2 h-4 w-4" />
              <span>Overview</span>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>

          {/** on click we perform the details callback and open a sheet defined */}
          <DropdownMenuItem onClick={detailsCallback}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Details</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          {installed && (
            <DropdownMenuItem onClick={handleDisconnect}>
              <Keyboard className="mr-2 h-4 w-4" />
              <span>
                {" "}
                {disconnectApp.status === "executing"
                  ? "Disconnecting..."
                  : "Disconnect App"}
              </span>
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* <DropdownMenuGroup>
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4" />
            <span>Team</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Invite users</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Message</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>More...</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Team</span>
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Github className="mr-2 h-4 w-4" />
          <span>GitHub</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Cloud className="mr-2 h-4 w-4" />
          <span>API</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator /> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
