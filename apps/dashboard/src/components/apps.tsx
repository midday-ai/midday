"use client";

import { capitalize } from "@/utils/utils";
import { apps, types } from "@midday/app-store";
import { Button } from "@midday/ui/button";
import {
  BarChart2,
  Bell,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { App } from "./app";

export type User = {
  id: string;
  team_id: string;
};

const categoryIcons = {
  [types.IntegrationCategory.Accounting]: <BarChart2 className="h-5 w-5" />,
  [types.IntegrationCategory.Assistant]: <HelpCircle className="h-5 w-5" />,
  [types.IntegrationCategory.Payroll]: <Briefcase className="h-5 w-5" />,
  [types.IntegrationCategory.Banking]: <Building2 className="h-5 w-5" />,
  [types.IntegrationCategory.CRM]: <MessageSquare className="h-5 w-5" />,
  [types.IntegrationCategory.Notification]: <Bell className="h-5 w-5" />,
};

const categoryDescriptions = {
  [types.IntegrationCategory.Accounting]: "Manage your financial records and transactions effortlessly. Streamline bookkeeping, invoicing, and financial reporting.",
  [types.IntegrationCategory.Assistant]: "Get AI-powered help for various tasks and queries. Enhance productivity with intelligent assistance and automation.",
  [types.IntegrationCategory.Payroll]: "Simplify your payroll processes and ensure accurate employee payments. Manage taxes, benefits, and compliance with ease.",
  [types.IntegrationCategory.Banking]: "Connect and manage your bank accounts securely. Automate reconciliations and gain real-time insights into your finances.",
  [types.IntegrationCategory.CRM]: "Manage customer relationships and interactions effectively. Improve sales, marketing, and customer service processes.",
  [types.IntegrationCategory.Notification]: "Stay informed with timely alerts and updates. Customize notifications for important events and activities.",
};

export function Apps({
  user,
  installedApps,
  settings,
}: { user: User; installedApps: string[]; settings: Record<string, any>[] }) {
  const searchParams = useSearchParams();
  const isInstalledPage = searchParams.get("tab") === "installed";
  const search = searchParams.get("q");
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<types.IntegrationCategory>(
    types.IntegrationCategory.Accounting
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const allApps = Object.values(apps).flat();

  const filteredApps = allApps
    .filter((app) => !isInstalledPage || installedApps.includes(app.id))
    .filter(
      (app) => !search || app.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((app) => app.category === activeCategory);

  const categories = Object.values(types.IntegrationCategory);

  return (
    <div className="flex py-[2%]">
      {/* Side Navigation */}
      <div className={`bg-gray-100 dark:bg-gray-800 h-screen p-4 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex justify-between items-center mb-4">
          {!isSidebarCollapsed && <h2 className="text-xl font-semibold">Categories</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="ml-auto"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            variant={activeCategory === category ? "default" : "ghost"}
            className={`w-full justify-start mb-2 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}
            title={capitalize(category)}
          >
            {categoryIcons[category]}
            {!isSidebarCollapsed && <span className="ml-2">{capitalize(category)}</span>}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex flex-col p-[2%]">
          <h1 className="text-5xl font-bold mb-2">{capitalize(activeCategory)} Integrations</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{categoryDescriptions[activeCategory]}</p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredApps.map((app) => (
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

          {!search && !filteredApps.length && (
            <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-200px)]">
              <h3 className="text-lg font-semibold text-[#1D1D1D] dark:text-[#F2F1EF]">
                No integrations in this category
              </h3>
              <p className="mt-2 text-sm text-[#878787] text-center max-w-md">
                There are no integrations available in the {activeCategory} category at the moment.
              </p>
            </div>
          )}

          {search && !filteredApps.length && (
            <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-200px)]">
              <h3 className="text-lg font-semibold text-[#1D1D1D] dark:text-[#F2F1EF]">
                No integrations found
              </h3>
              <p className="mt-2 text-sm text-[#878787] text-center max-w-md">
                No integrations found for your search in the {activeCategory} category.
              </p>

              <Button
                onClick={() => router.push("/apps")}
                className="mt-4"
                variant="outline"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}