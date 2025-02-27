import { useInitialConnectionStatus } from "@/hooks/use-initial-connection-status";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

type Props = {
  accessToken?: string;
  runId?: string;
  setRunId: (runId?: string) => void;
  onClose: () => void;
  setActiveTab: (value: "support" | "loading" | "select-accounts") => void;
};

export function LoadingTransactionsEvent({
  accessToken,
  runId,
  setRunId,
  onClose,
  setActiveTab,
}: Props) {
  const [step, setStep] = useState(1);
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const { status } = useInitialConnectionStatus({
    runId,
    accessToken,
  });

  useEffect(() => {
    if (status === "SYNCING") {
      setStep(2);
    }

    if (status === "COMPLETED") {
      setStep(3);

      setTimeout(() => {
        setRunId(undefined);
        router.push("/");
      }, 1000);
    }
  }, [status]);

  return (
    <div className="w-full">
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
      <h2 className="text-lg font-semibold leading-none tracking-tight mb-2">
        Setting up account
      </h2>

      <p className="text-sm text-[#878787] mb-8">
        Depending on the bank it can take up to 1 hour to fetch all
        transactions, feel free to close this window and we will notify you when
        it is done.
      </p>

      <ul className="text-md text-[#878787] space-y-4 transition-all">
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 0 && "!opacity-100",
          )}
        >
          Connecting bank
          {step === 1 && <span className="loading-ellipsis" />}
        </li>
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 1 && "!opacity-100",
          )}
        >
          Getting transactions
          {step === 2 && <span className="loading-ellipsis" />}
        </li>
        <li
          className={cn(
            "opacity-50 dark:opacity-20",
            step > 2 && "!opacity-100",
          )}
        >
          Completed
          {step === 3 && <span className="loading-ellipsis" />}
        </li>
      </ul>

      <div className="w-full mt-12">
        <Button className="w-full" onClick={onClose}>
          Close
        </Button>

        <div className="flex justify-center mt-4">
          <button
            type="button"
            className="text-xs text-[#878787]"
            onClick={() => setActiveTab("support")}
          >
            Need support
          </button>
        </div>
      </div>
    </div>
  );
}
