import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../button";
import { Card } from "../card";

/** Props for the NotificationBanner component. */
interface NotificationBannerProps {
  position?: "top" | "bottom";
  centered?: boolean;
  fullScreen?: boolean;
  marginLeft?: boolean;
  message: string;
  onSave?: () => void;
  onReject?: () => void;
}

/**
 * A simple notification banner component that displays a customizable message
 * with accept and reject options.
 *
 * @param props - Props for configuring the NotificationBanner component.
 * @returns A React element representing the NotificationBanner component.
 */
export default function NotificationBanner({
  position = "bottom",
  centered = false,
  fullScreen = false,
  marginLeft = false,
  message = "",
  onSave,
  onReject,
}: NotificationBannerProps) {
  const baseStyles =
    "pointer-events-none fixed inset-x-0 px-6 p-6 ring-1 ring-gray-900/10";

  const bannerClasses = cn(baseStyles, {
    "bottom-0": position === "bottom",
    "top-0": position === "top",
    "flex flex-col justify-between gap-x-8 gap-y-4 md:flex-row md:items-center":
      fullScreen,
    "mx-auto": centered,
    "ml-auto": marginLeft,
  });

  const handleSave = () => {
    if (onSave) onSave();
  };

  const handleReject = () => {
    if (onReject) onReject();
  };

  return (
    <div className={bannerClasses}>
      <Card className="pointer-events-auto max-w-xl rounded-2xl border-4 p-6 shadow-lg">
        <p className="text-sm leading-6 text-gray-900">{message}</p>
        <div className="mt-4 flex items-center gap-x-5">
          <Button
            className="rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            onClick={handleSave}
          >
            Accept
          </Button>
          <Button
            variant="ghost"
            className="text-sm font-semibold leading-6 text-gray-900"
            onClick={handleReject}
          >
            Reject
          </Button>
        </div>
      </Card>
    </div>
  );
}
