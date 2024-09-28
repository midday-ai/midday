import { updateAppSettingsAction } from "@/actions/update-app-settings-action";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { useAction } from "next-safe-action/hooks";

type AppSettingsItem = {
  id: string;
  label: string;
  description: string;
  type: "switch" | "text" | "select";
  required: boolean;
  value: string | boolean;
};

function AppSettingsItem({
  setting,
  appId,
}: {
  setting: AppSettingsItem;
  appId: string;
}) {
  const updateAppSettings = useAction(updateAppSettingsAction);

  switch (setting.type) {
    case "switch":
      return (
        <div className="flex items-center justify-between">
          <div className="pr-4 space-y-1">
            <Label className="text-foreground">{setting.label}</Label>
            <p className="text-xs text-foreground/50">
              {setting.description}
            </p>
          </div>
          <Switch
            disabled={updateAppSettings.isPending}
            checked={Boolean(setting.value)}
            onCheckedChange={(checked) => {
              updateAppSettings.execute({
                app_id: appId,
                option: {
                  id: setting.id,
                  value: Boolean(checked),
                },
              });
            }}
          />
        </div>
      );
    default:
      return null;
  }
}

export function AppSettings({
  settings,
  appId,
}: {
  settings: AppSettingsItem[];
  appId: string;
}) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide">
      {settings.map((setting) => (
        <div key={setting.id}>
          <AppSettingsItem setting={setting} appId={appId} />
        </div>
      ))}
    </div>
  );
}
