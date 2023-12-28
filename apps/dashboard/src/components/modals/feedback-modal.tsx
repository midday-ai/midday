"use client";

import { sendFeebackAction } from "@/actions/send-feedback-action";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Textarea } from "@midday/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hook";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function FeedbackModal() {
  const action = useAction(sendFeebackAction, {
    onSuccess: () => {
      setValue("");
    },
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const [value, setValue] = useState("");
  const isOpen = searchParams.has("feedback");

  return (
    <Dialog open={isOpen} onOpenChange={() => router.back()}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            {action.status !== "hasSucceeded" && (
              <DialogDescription>
                How can we improve Midday? If you have a feature request, can
                you also share why it's important to you?
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="mt-6">
            {action.status === "hasSucceeded" ? (
              <div className="min-h-[100px] flex items-center justify-center flex-col space-y-1">
                <p className="font-medium text-sm">
                  Thank you for your feedback!
                </p>
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
                  className="min-h-[100px] resize-none"
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
      </DialogContent>
    </Dialog>
  );
}
