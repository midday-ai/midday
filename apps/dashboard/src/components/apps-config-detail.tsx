import { IntegrationConfig } from "@midday/app-store/types";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Separator } from "@midday/ui/separator";
import { Switch } from "@midday/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { ExternalLink } from "lucide-react";
import {
  AwaitedReactNode,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
} from "react";

type AppConfigWithoutLogo = Omit<IntegrationConfig, "logo">;

export default function AppConfigDetail({
  config,
}: { config: AppConfigWithoutLogo }) {
  return (
    <Card className="w-full border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* {config.logo && <config.logo className="h-10 w-10" />} */}
            <div>
              <CardTitle>{config.name}</CardTitle>
              <CardDescription>{config.short_description}</CardDescription>
            </div>
          </div>
          <Switch checked={config.active} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-4 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="flex flex-col gap-6 p-[2.5%]">
              <section>
                <h3 className="text-lg font-semibold">Description</h3>
                <p>{config.description}</p>
              </section>
              <section className="flex flex-1 justify-between">
                <h3 className="text-lg font-semibold">Category</h3>
                <Button variant="secondary">{config.category}</Button>
              </section>
              <section className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {config.tags?.map((tag) => (
                    <Button key={tag} variant="outline">
                      {tag}
                    </Button>
                  ))}
                </div>
              </section>
              {config.supported_features &&
                config.supported_features.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold">
                      Supported Features
                    </h3>
                    <ul className="list-disc list-inside">
                      {config.supported_features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </section>
                )}
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="flex flex-col gap-6 p-[2.5%]">
              {config.settings.map((setting, index) => (
                <div key={index} className="flex flex-col gap-3">
                  <label htmlFor={`setting-${index}`} className="font-medium">
                    {setting.label}
                  </label>
                  {setting.type === "switch" && (
                    <Switch id={`setting-${index}`} />
                  )}
                  {setting.type === "text" && (
                    <Input
                      id={`setting-${index}`}
                      type="text"
                      placeholder={setting.description}
                    />
                  )}
                  {setting.type === "number" && (
                    <Input
                      id={`setting-${index}`}
                      type="number"
                      placeholder={setting.description}
                    />
                  )}
                  {setting.type === "select" && (
                    <Select>
                      <SelectTrigger id={`setting-${index}`}>
                        <SelectValue placeholder={setting.description} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Assuming options are available in setting.options */}
                        {setting.options?.map((option, optionIndex) => (
                          <SelectItem key={optionIndex} value={String(option)}>
                            {String(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-sm text-gray-500">{setting.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="permissions">
            <div className="flex flex-col gap-6 p-[2.5%]">
              {Object.entries(config.user_permissions || {}).map(
                ([role, permissions]) => (
                  <div key={role}>
                    <h3 className="text-lg font-semibold">{role}</h3>
                    <ul className="list-disc list-inside">
                      {permissions.map((permission) => (
                        <li key={permission}>{permission}</li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <div className="flex flex-col gap-6 p-[2.5%]">
              <div className="flex justify-between items-center">
                <span className="font-medium">API Version</span>
                <span>{config.api_version}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Webhook URL</span>
                <span>{config.webhook_url}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Last Sync</span>
                <span>
                  {config.last_sync_at
                    ? new Date(config.last_sync_at).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Sync Status</span>
                <span
                  className={
                    config.sync_status === "active"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {config.sync_status === "active" ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Auth Method</span>
                <span>{config.auth_method}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <Separator />
      <CardFooter className="justify-between">
        <Button variant="ghost">
          View Documentation <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
