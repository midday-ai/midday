"use client";

import { cn } from "@midday/ui/utils";
import { useEventRunStatuses } from "@trigger.dev/react";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

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
        animationData={require("public/assets/setup-animation.json")}
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
        <li className={cn("opacity-20", step > 0 && "opacity-100")}>
          Connecting bank
          {step === 1 && <span className="loading-ellipsis" />}
        </li>
        <li className={cn("opacity-20", step > 1 && "opacity-100")}>
          Getting transactions
          {step === 2 && <span className="loading-ellipsis" />}
        </li>
        <li className={cn("opacity-20", step > 2 && "opacity-100")}>
          Completed
          {step === 3 && <span className="loading-ellipsis" />}
        </li>
      </ul>
    </div>
  );
}
