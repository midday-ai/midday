"use client";

import { useAssistantStore } from "@/store/assistant";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import { QuestionMarkIcon } from "@radix-ui/react-icons";

/**
 * ChatAccessibilityButton Component
 *
 * This component renders a floating button that opens the chat assistant when clicked.
 * It's positioned at the bottom right corner of the screen and is hidden on small screens.
 *
 * @remarks
 * - The button is only visible on screens larger than the 'sm' breakpoint (typically 640px).
 * - It uses the `useAssistantStore` hook to access the `setOpen` function for opening the chat.
 * - The button's position is adjusted to account for potential scrollbar changes when the chat opens.
 *
 * @returns A React functional component
 */
const ChatAccessibilityButton: React.FC<{
  className?: string;
  isWidget?: boolean;
  title?: string;
}> = ({ className, isWidget = false, title }) => {
  const { setOpen } = useAssistantStore();

  return (
    <Button
      variant="ghost"
      className="flex flex-1 items-center gap-2 border-0 w-full justify-start"
      onClick={() => setOpen("Assistant")}
    >
      <div
        className={cn(
          isWidget && "fixed bottom-0 m-4 hidden sm:block",
          className,
        )}
      >
        <button
          className="inline-flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          style={
            isWidget
              ? {
                  marginRight:
                    "calc(20px + var(--removed-body-scroll-bar-size, 0px))",
                }
              : undefined
          }
          aria-label="Open income view"
        >
          <QuestionMarkIcon className="h-5 w-5" strokeWidth={0.5} />
        </button>
      </div>
      {title && <span className="text-lg">{title}</span>}
    </Button>
  );
};

export default ChatAccessibilityButton;
