import { useTRPC } from "@/trpc/client";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateAppSettingsMutation = useMutation(
    trpc.apps.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.apps.installed.queryKey(),
        });
      },
    }),
  );

  switch (setting.type) {
    case "switch":
      return (
        <div className="flex items-center justify-between">
          <div className="pr-4 space-y-1">
            <Label className="text-[#878787]">{setting.label}</Label>
            <p className="text-xs text-[#878787]">{setting.description}</p>
          </div>
          <Switch
            disabled={updateAppSettingsMutation.isPending}
            checked={Boolean(setting.value)}
            onCheckedChange={(checked) => {
              updateAppSettingsMutation.mutate({
                appId,
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
    <div>
      {settings.map((setting) => (
        <div key={setting.id}>
          <AppSettingsItem setting={setting} appId={appId} />
        </div>
      ))}
    </div>
  );
}
