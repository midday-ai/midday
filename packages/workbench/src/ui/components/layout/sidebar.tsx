import {
  ChevronDown,
  ChevronRight,
  Clock,
  FlaskConical,
  Layers,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Play,
  Sun,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItem = "runs" | "schedulers" | "queues" | "test";

interface SidebarProps {
  queues: string[];
  activeNav: NavItem;
  activeQueue?: string;
  onNavSelect: (nav: NavItem) => void;
  onQueueSelect: (queue: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  title?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  queues,
  activeNav,
  activeQueue,
  onNavSelect,
  onQueueSelect,
  isDark,
  onToggleTheme,
  title = "Workbench",
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [queuesExpanded, setQueuesExpanded] = React.useState(true);

  const navItems: { id: NavItem; label: string; icon: typeof Play }[] = [
    { id: "runs", label: "Runs", icon: Play },
    { id: "schedulers", label: "Schedulers", icon: Clock },
    { id: "test", label: "Test", icon: FlaskConical },
  ];

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-3">
        {!collapsed && (
          <h1 className="font-semibold text-sm truncate">{title}</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className={cn("h-8 w-8 shrink-0", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className={cn("p-2 space-y-1", collapsed && "px-1")}>
          {/* Main nav items */}
          {navItems.map((item) =>
            collapsed ? (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeNav === item.id ? "secondary" : "ghost"}
                    size="icon"
                    className="w-full h-9"
                    onClick={() => onNavSelect(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                key={item.id}
                variant={activeNav === item.id ? "secondary" : "ghost"}
                className="w-full justify-start h-9"
                onClick={() => onNavSelect(item.id)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ),
          )}

          {/* Queues Section */}
          <div className="pt-3">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeNav === "queues" ? "secondary" : "ghost"}
                    size="icon"
                    className="w-full h-9"
                    onClick={() => onNavSelect("queues")}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Queues</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-9 px-2"
                  onClick={() => setQueuesExpanded(!queuesExpanded)}
                >
                  <span className="flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    Queues
                  </span>
                  {queuesExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
                {queuesExpanded && (
                  <div className="pl-4 space-y-0.5 mt-1">
                    {queues.map((queue) => (
                      <Button
                        key={queue}
                        variant={activeQueue === queue ? "secondary" : "ghost"}
                        className="w-full justify-start font-mono text-xs h-8"
                        onClick={() => onQueueSelect(queue)}
                      >
                        <span className="truncate">{queue}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className="w-full h-9"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isDark ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="w-full h-9"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </>
  );
}
