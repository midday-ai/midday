"use client";

import { subscribeEmail } from "@/actions/subscribeEmail";
import { Icons } from "@midday/ui/icons";
import { useState } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <div className="absolute top-1 right-0">
        <Icons.Loader className="absolute w-4 h-4 mr-3 text-black animate-spin top-2.5 right-2" />
      </div>
    );
  }

  return (
    <button
      type="submit"
      className="absolute right-2 h-7 bg-white top-2 px-4 rounded-md font-medium text-sm z-10 text-black"
    >
      Join
    </button>
  );
}

export function SignupAppsForm() {
  const [isSubmitted, setSubmitted] = useState(false);

  return (
    <div className="w-[330px]">
      {isSubmitted ? (
        <div className="border border-[#2C2C2C] font-sm text-white h-11 rounded-lg w-full flex items-center py-1 px-3 justify-between">
          <p>Subscribed!</p>

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
            await subscribeEmail(formData, "apps");
            setSubmitted(true);
          }}
        >
          <fieldset className="relative">
            <input
              placeholder="Enter your email"
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              aria-label="Email address"
              required
              className="border bg-transparent border-[#2C2C2C] font-sm text-white outline-none py-1 px-3 w-[330px] placeholder-[#606060] rounded-lg h-11"
            />
            <SubmitButton />
          </fieldset>
        </form>
      )}
    </div>
  );
}
