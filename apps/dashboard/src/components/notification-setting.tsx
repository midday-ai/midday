"use client";

import { Checkbox } from "@midday/ui/checkbox";
import { Label } from "@midday/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type Props = {
  type: string;
  name: string;
  description: string;
  settings: {
    channel: "in_app" | "email" | "push";
    enabled: boolean;
  }[];
};

export function NotificationSetting({
  type,
  name,
  description,
  settings,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateSetting = useMutation(
    trpc.notificationSettings.update.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({
          queryKey: trpc.notificationSettings.getAll.queryKey(),
        });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(
          trpc.notificationSettings.getAll.queryKey(),
        );

        // Optimistically update the cache
        queryClient.setQueryData(
          trpc.notificationSettings.getAll.queryKey(),
          (old) => {
            if (!old) return old;

            return old.map((notificationType) => {
              if (notificationType.type !== variables.notificationType) {
                return notificationType;
              }

              return {
                ...notificationType,
                settings: notificationType.settings.map((setting) => {
                  if (setting.channel !== variables.channel) {
                    return setting;
                  }
                  return {
                    ...setting,
                    enabled: variables.enabled,
                  };
                }),
              };
            });
          },
        );

        // Return a context object with the snapshotted value
        return { previousData };
      },
      onError: (_, __, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.notificationSettings.getAll.queryKey(),
            context.previousData,
          );
        }
      },
      onSettled: () => {
        // Always refetch after error or success to ensure we have the latest data
        queryClient.invalidateQueries({
          queryKey: trpc.notificationSettings.getAll.queryKey(),
        });
      },
    }),
  );

  const onChange = (
    channel: "in_app" | "email" | "push",
    newEnabled: boolean,
  ) => {
    updateSetting.mutate({
      notificationType: type,
      channel,
      enabled: newEnabled,
    });
  };

  const getSettingByChannel = (channel: "in_app" | "email" | "push") => {
    return settings.find((s) => s.channel === channel);
  };

  return (
    <div className="border-b-[1px] pb-4 mb-4">
      <div className="flex items-start justify-between">
        {/* Left side - Name and Description */}
        <div className="flex-1 pr-8">
          <Label className="text-sm font-medium">{name}</Label>
          <p className="text-sm text-[#606060] mt-1">{description}</p>
        </div>

        <div className="flex gap-8 items-center">
          {/* In-App Checkbox */}
          {getSettingByChannel("in_app") && (
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-xs font-medium text-[#606060]">
                In-app
              </Label>
              <Checkbox
                id={`${type}-in_app`}
                checked={getSettingByChannel("in_app")?.enabled ?? false}
                onCheckedChange={(checked) => onChange("in_app", !!checked)}
              />
            </div>
          )}

          {getSettingByChannel("email") && (
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-xs font-medium text-[#606060]">
                Email
              </Label>
              <Checkbox
                id={`${type}-email`}
                checked={getSettingByChannel("email")?.enabled ?? false}
                onCheckedChange={(checked) => onChange("email", !!checked)}
              />
            </div>
          )}

          {getSettingByChannel("push") && (
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-xs font-medium text-[#606060]">Push</Label>
              <Checkbox
                id={`${type}-push`}
                checked={getSettingByChannel("push")?.enabled ?? false}
                onCheckedChange={(checked) => onChange("push", !!checked)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
