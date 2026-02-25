import { cn } from "../utils";
import { AnimatedSizeContainer } from "./animated-size-container";
import { Button, type ButtonProps } from "./button";
import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { TextMorph } from "./text-morph";

type SubmitButtonMorphProps = {
  children: string;
  isSubmitting: boolean;
  completed?: boolean;
  disabled?: boolean;
} & ButtonProps;

export function SubmitButtonMorph({
  children,
  isSubmitting,
  completed = false,
  disabled,
  ...props
}: SubmitButtonMorphProps) {
  const isBlocked = Boolean(isSubmitting || disabled);

  return (
    <Button
      disabled={disabled}
      aria-disabled={isBlocked}
      {...props}
      className={cn(
        "relative",
        isSubmitting && "pointer-events-none",
        props.className,
      )}
    >
      <AnimatedSizeContainer width className="inline-flex">
        <span className="inline-flex items-center gap-2 w-max">
          {isSubmitting ? (
            completed ? (
              <Icons.Check className="size-4 shrink-0" />
            ) : (
              <Spinner />
            )
          ) : null}
          <TextMorph as="span">{children}</TextMorph>
        </span>
      </AnimatedSizeContainer>
    </Button>
  );
}
