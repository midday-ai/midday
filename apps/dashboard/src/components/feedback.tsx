"use client";

import { sendFeeback } from "@/actions";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Textarea } from "@midday/ui/textarea";
import { cn } from "@midday/ui/utils";
import { useState } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit">
      {pending ? (
        <Icons.Loader className="w-4 h-4 text-black animate-spin" />
      ) : (
        "Send"
      )}
    </Button>
  );
}

export function Feedback() {
  const [isSubmitted, setSubmitted] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="rounded-lg font-normal h-8 py-0 px-4 text-sm text-muted-foreground"
        >
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("rounded-xl w-[340px]")}
        sideOffset={10}
        align="end"
      >
        {isSubmitted ? (
          <div className="min-h-[100px] flex items-center justify-center flex-col space-y-1">
            <p className="font-medium text-sm">Thank you for your feedback!</p>
            <p className="text-sm text-[#4C4C4C]">
              We will be back with you as soon as possible
            </p>
          </div>
        ) : (
          <form
            className="space-y-4"
            action={async (formData) => {
              await sendFeeback(formData);
              setSubmitted(true);
              setValue("");
            }}
          >
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
              <SubmitButton />
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
