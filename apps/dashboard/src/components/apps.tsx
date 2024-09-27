"use client";

import { apps } from "@midday/apps";
import { App } from "./app";

export type User = {
  id: string;
  team_id: string;
};

export function Apps({
  user,
  installedApps,
  settings,
}: { user: User; installedApps: string[]; settings: Record<string, any>[] }) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mx-auto mt-8">
      {apps.map((app) => (
        <App
          key={app.id}
          installed={installedApps?.includes(app.id)}
          {...app}
          userSettings={
            settings.find((setting) => setting.app_id === app.id)?.settings ??
            []
          }
          onInitialize={() => app.onInitialize(user)}
        />
      ))}
    </div>
  );
}
