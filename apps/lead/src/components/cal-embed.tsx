import { getCalApi } from "@calcom/embed-react";
import { buttonVariants } from "@midday/ui/button";
import { PhoneIcon } from "lucide-react";
import React, { useEffect } from "react";

const CalButton: React.FC<{
  className?: string;
  text?: string;
  enableIcon?: boolean;
}> = ({ className, text, enableIcon = true }) => {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "15min" });
      cal("ui", {
        styles: {
          branding: {
            brandColor: "#000000",
          },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <button
      data-cal-namespace="15min"
      data-cal-link="solomonai/15min"
      data-cal-config='{"layout":"month_view"}'
      className={buttonVariants({
        variant: "default",
        className: "h-12 rounded-2xl border border-primary px-6",
      })}
    >
      {enableIcon && <PhoneIcon className="mr-2 h-4 w-4" />}
      {text || "Book a call"}
    </button>
  );
};

export default CalButton;
