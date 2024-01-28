import { sendFeebackAction } from "@/actions/send-feedback-action";
import { BackButton } from "@/components/command-menu/back-button";
import { Button } from "@midday/ui/button";
import { Textarea } from "@midday/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

export function CommandFeedback() {
  const [value, setValue] = useState("");

  const action = useAction(sendFeebackAction, {
    onSuccess: () => {
      setValue("");
    },
  });

  return (
    <div className="h-full">
      <div className="p-5 flex items-center space-x-3">
        <BackButton />
        <h2>Send Feedback</h2>
      </div>
      <div className="p-4">
        {action.status === "hasSucceeded" ? (
          <div className="min-h-[100px] flex items-center justify-center flex-col space-y-1 mt-12">
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
              className="min-h-[200px] resize-none"
              onChange={(evt) => setValue(evt.target.value)}
            />

            <div className="mt-1 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => action.execute({ feedback: value })}
                disabled={action.status === "executing"}
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
