"use client";

import { sendFeebackAction } from "@/actions/send-feedback-action";
import { Button } from "@midday/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Textarea } from "@midday/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

export function FeedbackForm() {
  const [value, setValue] = useState("");

  const action = useAction(sendFeebackAction, {
    onSuccess: () => {
      setValue("");
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild className="hidden md:block">
        <Button variant="outline">Feedback</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px]" sideOffset={10}>
        <form className="space-y-4">
          <Textarea
            name="feedback"
            value={value}
            required
            autoFocus
            placeholder="Ideas to improve this page or issues you are experiencing."
            className="resize-none h-[120px]"
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
      </PopoverContent>
    </Popover>
  );
}
