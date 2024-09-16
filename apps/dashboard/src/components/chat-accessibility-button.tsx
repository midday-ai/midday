"use client";

import { useAssistantStore } from "@/store/assistant";
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
const ChatAccessibilityButton = () => {
  const { setOpen } = useAssistantStore();

  return (
    <div className="fixed bottom-0 m-4 hidden sm:block">
      <button
        className="inline-flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => setOpen()}
        style={{
          marginRight: "calc(20px + var(--removed-body-scroll-bar-size, 0px))",
        }}
        aria-label="Open chat assistant"
      >
        <QuestionMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ChatAccessibilityButton;
