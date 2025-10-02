import type { ReactNode } from "react";

interface ConfigurableWidgetProps {
  isConfiguring: boolean;
  children: ReactNode;
  settings: ReactNode;
}

export function ConfigurableWidget({
  isConfiguring,
  children,
  settings,
}: ConfigurableWidgetProps) {
  if (isConfiguring) {
    return (
      <div className="dark:bg-[#0c0c0c] border dark:border-[#1d1d1d] p-6 h-[210px] flex flex-col">
        {settings}
      </div>
    );
  }

  return <>{children}</>;
}
