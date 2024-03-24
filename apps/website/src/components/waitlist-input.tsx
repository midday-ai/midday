"use client";

import { subscribeAction } from "@/actions/subscribe-action";
import { useLogSnag } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <div className="absolute top-1 right-0">
        <Loader2 className="absolute w-4 h-4 mr-3 text-base animate-spin top-2.5 right-2" />
      </div>
    );
  }

  return (
    <button
      type="submit"
      className="absolute right-2 h-7 bg-primary top-2 px-4 rounded-md font-medium text-sm z-10 text-primary-foreground"
    >
      Join
    </button>
  );
}

export function WaitlistInput() {
  const [isSubmitted, setSubmitted] = useState(false);
  const { track } = useLogSnag();

  return (
    <div>
      <div className="flex justify-center -mt-28">
        {isSubmitted ? (
          <div className="border border-[#2C2C2C] font-sm text-primary h-11 rounded-lg w-[330px] flex items-center py-1 px-3 justify-between">
            <p>{t("subscribed")}</p>

            <svg
              width="17"
              height="17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Check</title>
              <path
                d="m14.546 4.724-8 8-3.667-3.667.94-.94 2.727 2.72 7.06-7.053.94.94Z"
                fill="#fff"
              />
            </svg>
          </div>
        ) : (
          <form
            action={async (formData) => {
              setSubmitted(true);
              await subscribeAction(formData, "engine");
              const email = formData.get("email") as string;

              track({
                event: LogEvents.Engine.name,
                notify: true,
                icon: LogEvents.Engine.icon,
                channel: LogEvents.Engine.channel,
                tags: {
                  email,
                },
              });

              setTimeout(() => {
                setSubmitted(false);
              }, 5000);
            }}
          >
            <fieldset className="relative z-50">
              <input
                placeholder="Enter your email"
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                aria-label="Email address"
                required
                className="bg-transparent font-sm text-primary outline-none py-1 px-3 w-[360px] placeholder-[#606060] rounded-lg h-11 border border-border"
              />
              <SubmitButton />
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
}
