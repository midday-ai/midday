import React from "react";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { ChevronLeft } from "lucide-react";

/**
 * Props for the SidebarToggle component.
 */
interface SidebarToggleProps {
  /** Indicates whether the sidebar is open */
  isOpen: boolean | undefined;
  /** Function to toggle the sidebar open/closed state */
  setIsOpen?: () => void;
}

/**
 * SidebarToggle component that renders a button to toggle the sidebar.
 * The button is visible only on large screens and changes its icon direction based on the sidebar state.
 *
 * @param {SidebarToggleProps} props - The component props
 * @returns {React.ReactElement} The rendered SidebarToggle component
 */
export const SidebarToggle: React.FC<SidebarToggleProps> = React.memo(
  ({ isOpen, setIsOpen }) => {
    const handleToggle = React.useCallback(() => {
      setIsOpen?.();
    }, [setIsOpen]);

    return (
      <div className="invisible absolute -right-[16px] top-[12px] z-20 lg:visible">
        <Button
          onClick={handleToggle}
          className="h-8 w-8 rounded-md"
          variant="outline"
          size="icon"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-700 ease-in-out",
              isOpen === false ? "rotate-180" : "rotate-0",
            )}
          />
        </Button>
      </div>
    );
  },
);

SidebarToggle.displayName = "SidebarToggle";
