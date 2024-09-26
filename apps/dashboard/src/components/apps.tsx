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
}: { user: User; installedApps: string[] }) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mx-auto mt-8">
      {apps.map((app) => (
        <App
          key={app.id}
          user={user}
          installed={installedApps?.includes(app.id)}
          {...app}
          onInitialize={() => app.onInitialize(user)}
        />
      ))}
    </div>
  );
}
