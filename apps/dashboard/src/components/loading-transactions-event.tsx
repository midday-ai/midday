"use client";

import { cn } from "@midday/ui/cn";
import { useEventRunStatuses } from "@trigger.dev/react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

export function LoadingTransactionsEvent({
  eventId,
  setEventId,
  onClose,
}: {
  eventId: string;
}) {
  const { statuses } = useEventRunStatuses(eventId);
  const status = statuses?.at(0);
  const [step, setStep] = useState(1);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (status?.data.step) {
      if (status.data.step === "getting_transactions") {
        setStep(2);
      }

      if (status.data.step === "completed") {
        setStep(3);
        setTimeout(() => {
          onClose();
        }, 500);

        setTimeout(() => {
          setEventId(undefined);
        }, 1000);
      }
    }
  }, [status]);

  return (
    <div className="h-[250px]">
      <Lottie
        className="mb-6"
        animationData={
          resolvedTheme === "dark"
            ? require("public/assets/setup-animation.json")
            : require("public/assets/setup-animation-dark.json")
        }
        loop={true}
        style={{ width: 50, height: 50 }}
        rendererSettings={{
          preserveAspectRatio: "xMidYMid slice",
        }}
      />
      <h2 className="text-lg font-semibold leading-none tracking-tight mb-8">
        Setting up account
      </h2>

      <ul className="text-md text-[#878787] space-y-4 transition-all">
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 0 && "!opacity-100"
          )}
        >
          Connecting bank
          {step === 1 && <span className="loading-ellipsis" />}
        </li>
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 1 && "!opacity-100"
          )}
        >
          Getting transactions
          {step === 2 && <span className="loading-ellipsis" />}
        </li>
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 2 && "!opacity-100"
          )}
        >
          Completed
          {step === 3 && <span className="loading-ellipsis" />}
        </li>
      </ul>
    </div>
  );
}
