import { cn } from "@midday/ui/cn";
import { useLongPress } from "@/hooks/use-long-press";
import { useIsCustomizing, useWidgetActions } from "./widget-provider";

interface BaseWidgetProps {
  title: string;
  description: React.ReactNode;
  onClick?: () => void;
  actions: React.ReactNode;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

export function BaseWidget({
  children,
  onClick,
  title,
  description,
  actions,
  icon,
}: BaseWidgetProps) {
  const isCustomizing = useIsCustomizing();
  const { setIsCustomizing } = useWidgetActions();

  const longPressHandlers = useLongPress({
    onLongPress: () => setIsCustomizing(true),
    onClick,
    threshold: 500,
    disabled: isCustomizing,
  });

  return (
    <div
      className={cn(
        "dark:bg-[#0c0c0c] border dark:border-[#1d1d1d] p-4 h-[210px] flex flex-col justify-between transition-all duration-300 dark:hover:bg-[#0f0f0f] dark:hover:border-[#222222] group",
        !isCustomizing && "cursor-pointer",
      )}
      {...longPressHandlers}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[#666666]">{icon}</span>
            <h3 className="text-xs text-[#666666] font-medium">{title}</h3>
          </div>
        </div>

        {typeof description === "string" ? (
          <p className="text-sm text-[#666666]">{description}</p>
        ) : (
          description
        )}
      </div>

      <div>
        {children}

        <span className="text-xs text-[#666666] group-hover:text-primary transition-colors duration-300">
          {actions}
        </span>
      </div>
    </div>
  );
}
