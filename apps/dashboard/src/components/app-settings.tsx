import { updateAppSettingsAction } from "@/actions/update-app-settings-action";
import { Settings } from "@midday/app-store/types";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Switch } from "@midday/ui/switch";
import { useAction } from "next-safe-action/hooks";

function AppSettingsItem({
  setting,
  appId,
}: {
  setting: Settings;
  appId: string;
}) {
  const updateAppSettings = useAction(updateAppSettingsAction);

  const handleValueChange = (value: unknown) => {
    updateAppSettings.execute({
      app_id: appId,
      option: {
        id: setting.id,
        value,
      },
    });
  };

  const renderInput = () => {
    switch (setting.type) {
      case "switch":
        return (
          <Switch
            disabled={updateAppSettings.isPending}
            checked={Boolean(setting.value)}
            onCheckedChange={(checked) => handleValueChange(checked)}
          />
        );
      case "text":
        return (
          <Input
            type="text"
            value={String(setting.value)}
            onChange={(e) => handleValueChange(e.target.value)}
            required={setting.required}
            disabled={updateAppSettings.isPending}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={Number(setting.value)}
            onChange={(e) => handleValueChange(Number(e.target.value))}
            required={setting.required}
            min={setting.min}
            disabled={updateAppSettings.isPending}
          />
        );
      case "select":
        return (
          <Select
            value={String(setting.value)}
            onValueChange={(value) => handleValueChange(value)}
            disabled={updateAppSettings.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between md:grid md:grid-cols-2 gap-2">
      <div className="pr-4 space-y-1">
        <Label className="text-foreground">{setting.label}</Label>
        <p className="text-xs text-foreground/50">{setting.description}</p>
      </div>
      {renderInput()}
    </div>
  );
}

export function AppSettings({
  settings,
  appId,
}: {
  settings: Settings[];
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
