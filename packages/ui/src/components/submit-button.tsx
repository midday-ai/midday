import { Loader2 } from "lucide-react";
import { cn } from "../utils";
import { Button, type ButtonProps } from "./button";

export function SubmitButton({
  children,
  isSubmitting,
  ...props
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
} & ButtonProps) {
  return (
    <Button disabled={isSubmitting} {...props}>
      <span className={cn({ "opacity-0": isSubmitting })}>{children}</span>

      {isSubmitting && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </Button>
  );
}
