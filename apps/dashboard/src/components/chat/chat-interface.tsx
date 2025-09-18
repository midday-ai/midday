"use client";

import { Canvas } from "@/components/canvas/canvas";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { Messages } from "@/components/chat/messages";
import { type CanvasType, useCanvasState } from "@/hooks/use-canvas-state";
import { cn } from "@midday/ui/cn";

type Props = {
  initialTitle?: string | null;
};

const canvasTypes: { type: CanvasType; label: string }[] = [
  { type: "burn-rate-canvas", label: "Burn Rate" },
  { type: "revenue-canvas", label: "Revenue" },
  { type: "profit-canvas", label: "Profit" },
  { type: "expenses-canvas", label: "Expenses" },
  { type: "runway-canvas", label: "Runway" },
  { type: "cash-flow-canvas", label: "Cash Flow" },
  { type: "balance-sheet-canvas", label: "Balance Sheet" },
  { type: "category-expenses-canvas", label: "Category Expenses" },
  { type: "health-report-canvas", label: "Health Report" },
  { type: "profit-analysis-canvas", label: "Profit Analysis" },
  { type: "spending-canvas", label: "Spending" },
];

export function ChatInterface({ initialTitle }: Props) {
  const {
    isVisible: isCanvasVisible,
    canvasType,
    showCanvas,
    hide: hideCanvas,
  } = useCanvasState();

  return (
    <div className="relative h-full overflow-hidden w-full">
      <div className="fixed top-20 left-4 z-50 flex flex-col gap-2">
        {isCanvasVisible && (
          <button
            type="button"
            onClick={hideCanvas}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Hide Canvas
          </button>
        )}
        <div className="grid grid-cols-2 gap-1 max-h-96 overflow-y-auto">
          {canvasTypes.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => showCanvas(type)}
              className={`px-2 py-1 text-xs rounded ${
                isCanvasVisible && canvasType === type
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "relative h-full w-full transition-all duration-300 ease-in-out",
          isCanvasVisible && "pr-[603px]",
        )}
      >
        <ChatHeader title={initialTitle} />

        <div className="relative w-full">
          <Messages />
          <ChatInput />
        </div>
      </div>

      <Canvas />
    </div>
  );
}
