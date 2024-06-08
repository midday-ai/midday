import { sendFeebackAction } from "@/actions/send-feedback-action";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Textarea } from "@midday/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

type Props = {
  onClose: () => void;
};

export function AssistantFeedback({ onClose }: Props) {
  const [value, setValue] = useState("");

  const action = useAction(sendFeebackAction, {
    onSuccess: () => {
      setValue("");
    },
  });

  return (
    <div className="h-full absolute top-0 left-0 right-0 bottom-0 z-[100] bg-background">
      <div className="p-5 flex items-center space-x-3">
        <button
          type="button"
          className="items-center rounded border bg-accent p-1"
          onClick={onClose}
        >
          <Icons.ArrowBack />
        </button>
        <h2>Send Feedback</h2>
      </div>
      <div className="p-4">
        {action.status === "hasSucceeded" ? (
          <div className="min-h-[100px] flex items-center justify-center flex-col space-y-1 mt-[100px]">
            <p className="font-medium text-sm">Thank you for your feedback!</p>
            <p className="text-sm text-[#4C4C4C]">
              We will be back with you as soon as possible
            </p>
          </div>
        ) : (
          <form className="space-y-4">
            <Textarea
              name="feedback"
              value={value}
              required
              autoFocus
              placeholder="Your feedback..."
              className="min-h-[320px] resize-none"
              onChange={(evt) => setValue(evt.target.value)}
            />

            <div className="mt-1 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => action.execute({ feedback: value })}
                disabled={value.length === 0 || action.status === "executing"}
              >
                {action.status === "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
