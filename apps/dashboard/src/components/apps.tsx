"use client";

import { capitalize } from "@/utils/utils";
import { apps, types } from "@midday/app-store";
import { Button } from "@midday/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  Bell,
  Briefcase,
  Building2,
  ChartNetwork,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  HelpCircle,
  Menu,
  MessageSquare,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { App } from "./app";

export type User = {
  id: string;
  team_id: string;
};

const categoryIcons = {
  [types.IntegrationCategory.Accounting]: (
    <BarChart2 className="h-7 w-7" strokeWidth={0.5} />
  ),
  [types.IntegrationCategory.Assistant]: (
    <HelpCircle className="h-7 w-7" strokeWidth={0.5} />
  ),
  [types.IntegrationCategory.Payroll]: (
    <Briefcase className="h-7 w-7" strokeWidth={0.5} />
  ),
  [types.IntegrationCategory.Banking]: (
    <Building2 className="h-7 w-7" strokeWidth={0.5} />
  ),
  [types.IntegrationCategory.CRM]: (
    <MessageSquare className="h-7 w-7" strokeWidth={0.5} />
  ),
  [types.IntegrationCategory.Notification]: (
    <Bell className="h-7 w-7" strokeWidth={0.5} />
  ),
  [types.IntegrationCategory.Modelling]: (
    <ChartNetwork className="h-7 w-7" strokeWidth={0.5} />
  ),
  [types.IntegrationCategory.GoalTemplates]: (
    <Crosshair className="h-7 w-7" strokeWidth={0.5} />
  ),
};

const categoryDescriptions = {
  [types.IntegrationCategory.Accounting]:
    "Manage your financial records and transactions effortlessly. Streamline bookkeeping, invoicing, and financial reporting.",
  [types.IntegrationCategory.Assistant]:
    "Get AI-powered help for various tasks and queries. Enhance productivity with intelligent assistance and automation.",
  [types.IntegrationCategory.Payroll]:
    "Simplify your payroll processes and ensure accurate employee payments. Manage taxes, benefits, and compliance with ease.",
  [types.IntegrationCategory.Banking]:
    "Connect and manage your bank accounts securely. Automate reconciliations and gain real-time insights into your finances.",
  [types.IntegrationCategory.CRM]:
    "Manage customer relationships and interactions effectively. Improve sales, marketing, and customer service processes.",
  [types.IntegrationCategory.Notification]:
    "Stay informed with timely alerts and updates. Customize notifications for important events and activities.",
  [types.IntegrationCategory.Modelling]:
    "Create and analyze financial models for better decision-making. Forecast business performance and plan for the future.",
  [types.IntegrationCategory.GoalTemplates]:
    "Set and track goals for your business and personal life. Use templates to define objectives and key results.",
};

export function Apps({
  user,
  installedApps,
  settings,
}: { user: User; installedApps: string[]; settings: Record<string, any>[] }) {
  const searchParams = useSearchParams();
  const isInstalledPage = searchParams?.get("tab") === "installed";
  const search = searchParams?.get("q");
  const router = useRouter();

  const [activeCategory, setActiveCategory] =
    useState<types.IntegrationCategory>(types.IntegrationCategory.Accounting);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const allApps = Object.values(apps).flat();

  const filteredApps = allApps
    .filter((app) => !isInstalledPage || installedApps.includes(app.id))
    .filter(
      (app) => !search || app.name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((app) => app.category === activeCategory);

  const categories = Object.values(types.IntegrationCategory);

  return (
    <div className="flex py-[2%]">
      {/* Side Navigation */}
      <div
        className={`bg-gray-100 dark:bg-gray-800 h-screen p-4 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}
      >
        <AppsMarketplaceSidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            variant={activeCategory === category ? "default" : "ghost"}
            className={`w-full justify-start mb-2 ${isSidebarCollapsed ? "px-2" : "px-4"}`}
            title={capitalize(category)}
          >
            {categoryIcons[category]}
            {!isSidebarCollapsed && (
              <span className="ml-2">{capitalize(category)}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex flex-col p-[2%] md:min-h-[400px] bg-background/4 text-foreground items-center justify-center">
          <h1 className="md:text-7xl font-bold mb-2">
            {capitalize(activeCategory)} Integrations
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {categoryDescriptions[activeCategory]}
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredApps.map((app) => (
            <App
              key={app.id}
              installed={installedApps?.includes(app.id)}
              {...app}
              userSettings={
                settings.find((setting) => setting.app_id === app.id)
                  ?.settings ?? []
              }
              onInitialize={app.onInitialize}
              equation={"equation" in app ? app.equation : undefined}
              cfg={app}
            />
          ))}

          {!search && !filteredApps.length && (
            <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-200px)]">
              <h3 className="text-lg font-semibold text-[#1D1D1D] dark:text-[#F2F1EF]">
                No integrations in this category
              </h3>
              <p className="mt-2 text-sm text-[#878787] text-center max-w-md">
                There are no integrations available in the {activeCategory}{" "}
                category at the moment.
              </p>
            </div>
          )}

          {search && !filteredApps.length && (
            <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-200px)]">
              <h3 className="text-lg font-semibold text-[#1D1D1D] dark:text-[#F2F1EF]">
                No integrations found
              </h3>
              <p className="mt-2 text-sm text-[#878787] text-center max-w-md">
                No integrations found for your search in the {activeCategory}{" "}
                category.
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

export const AppsMarketplaceSidebar = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}) => {
  return (
    <motion.div
      className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-none"
      animate={{
        width: isSidebarCollapsed ? "60px" : "240px",
      }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Categories</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="text-white hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};
