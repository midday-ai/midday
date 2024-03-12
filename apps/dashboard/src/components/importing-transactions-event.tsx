"use client";

import { cn } from "@midday/ui/utils";
import { useEventRunStatuses } from "@trigger.dev/react";
import Lottie from "lottie-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ImportingTransactionsEvent({
  eventId,
  setTransactions,
}: {
  eventId: string;
}) {
  const { statuses } = useEventRunStatuses(eventId);
  const status = statuses?.at(0);
  const [step, setStep] = useState(1);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (status?.data.step) {
      if (status.data.step === "transforming") {
        setStep(2);
      }

      if (status.data.step === "completed") {
        setStep(3);

        setTimeout(() => {
          setTransactions(status.data.transactions);
        }, 500);
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
        Importing transactions
      </h2>

      <ul className="text-md text-[#878787] space-y-4 transition-all">
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 0 && "!opacity-100"
          )}
        >
          Analyzing transactions
          {step === 1 && <span className="loading-ellipsis" />}
        </li>
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 1 && "!opacity-100"
          )}
        >
          Transforming transactions
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
