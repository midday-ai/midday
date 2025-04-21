import { Loader2 } from "lucide-react";
import { cn } from "../utils";
import { Button, type ButtonProps } from "./button";
import { Spinner } from "./spinner";

export function SubmitButton({
  children,
  isSubmitting,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
  disabled?: boolean;
} & ButtonProps) {
  return (
    <Button
      disabled={isSubmitting || disabled}
      {...props}
      className={cn(props.className, "relative")}
    >
      <span style={{ visibility: isSubmitting ? "hidden" : "visible" }}>
        {children}
      </span>
      {isSubmitting && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Spinner />
        </span>
      )}
    </Button>
  );
}
