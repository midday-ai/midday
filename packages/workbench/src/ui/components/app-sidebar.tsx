"use client";

import {
  BarChart3,
  Clock,
  FlaskConical,
  Layers,
  Moon,
  Network,
  Play,
  Sun,
} from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueueInfo } from "@/lib/hooks";
import { cn } from "@/lib/utils";

// Lazy-loaded queue counts component
function QueueCounts({ queueName }: { queueName: string }) {
  const queueInfo = useQueueInfo(queueName);

  if (!queueInfo) {
    return (
      <div className="flex gap-2 text-[9px] text-muted-foreground">
        <span>Loading...</span>
      </div>
    );
  }

  const { counts } = queueInfo;
  const total =
    counts.waiting +
    counts.active +
    counts.completed +
    counts.failed +
    counts.delayed;

  return (
    <div className="flex gap-2 text-[9px]">
      {counts.active > 0 && (
        <span className="text-chart-2">{counts.active} active</span>
      )}
      {counts.waiting > 0 && (
        <span className="text-muted-foreground">{counts.waiting} waiting</span>
      )}
      {counts.failed > 0 && (
        <span className="text-chart-3">{counts.failed} failed</span>
      )}
      {total === 0 && <span className="text-muted-foreground">empty</span>}
    </div>
  );
}

// Custom Workbench logo icon
function WorkbenchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hexagon outline */}
      <path
        d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner processing bars */}
      <rect x="7" y="9" width="10" height="2" rx="0.5" fill="currentColor" />
      <rect x="7" y="13" width="6" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export type NavItem =
  | "runs"
  | "metrics"
  | "schedulers"
  | "flows"
  | "queues"
  | "test";

interface AppSidebarProps {
  queues: string[];
  pausedQueues?: Set<string>;
  activeNav: NavItem;
  activeQueue?: string;
  onNavSelect: (nav: NavItem) => void;
  onQueueSelect: (queue: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  title?: string;
}

export function AppSidebar({
  queues,
  pausedQueues = new Set(),
  activeNav,
  activeQueue,
  onNavSelect,
  onQueueSelect,
  isDark,
  onToggleTheme,
}: AppSidebarProps) {
  const mainNavItems = [
    { id: "runs" as const, label: "Runs", icon: Play },
    { id: "metrics" as const, label: "Metrics", icon: BarChart3 },
    { id: "schedulers" as const, label: "Schedulers", icon: Clock },
    { id: "flows" as const, label: "Flows", icon: Network },
    { id: "test" as const, label: "Test", icon: FlaskConical },
  ];

  const NavButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    isPaused,
  }: {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isPaused?: boolean;
  }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={cn(
              "flex w-full items-center justify-center p-2 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="relative">
              <Icon className="h-4 w-4 shrink-0" />
              {isPaused && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={16}>
          <span className="flex items-center gap-2">
            {label}
            {isPaused && <span className="text-amber-500">(paused)</span>}
          </span>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside className="flex h-screen w-[52px] flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-center border-b border-border">
        <WorkbenchIcon className="h-5 w-5" />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-2">
          {/* Main Nav */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeNav === item.id}
                onClick={() => onNavSelect(item.id)}
              />
            ))}
          </nav>

          {/* Queues Section */}
          <div className="border-t border-border pt-2">
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-center p-2 text-sm font-medium transition-colors",
                    activeNav === "queues" || activeQueue
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Layers className="h-4 w-4 shrink-0" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                side="right"
                align="start"
                sideOffset={16}
                className="w-auto min-w-[140px] p-1"
              >
                <div className="space-y-0.5">
                  <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Queues
                  </div>
                  {queues.map((queue) => (
                    <button
                      key={queue}
                      type="button"
                      onClick={() => onQueueSelect(queue)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 px-2 py-1.5 transition-colors",
                        activeQueue === queue
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="font-mono text-[11px]">{queue}</span>
                        {pausedQueues.has(queue) && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                      </div>
                      <QueueCounts queueName={queue} />
                    </button>
                  ))}
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </ScrollArea>

      {/* Footer - Theme toggle only */}
      <div className="border-t border-border p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex w-full items-center justify-center rounded p-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              {isDark ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={16}>
            {isDark ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
