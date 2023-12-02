import { cn } from "@midday/ui/utils";

export function OnboardingStep({ active, done }) {
  return (
    <div
      className={cn(
        "absolute -left-[66px] top-7 z-10 block h-5 w-5 rounded-full bg-background"
      )}
    >
      <div
        className={cn(
          "ml-1 mt-1 h-3 w-3 rounded-full border-2 transition duration-200 ease-in-out border-primary/30 items-center flex justify-center",
          active && "border-primary",
          done && "border-primary"
        )}
      >
        {done && <div className="w-1 h-1 bg-primary rounded-full" />}
      </div>
    </div>
  );
}
