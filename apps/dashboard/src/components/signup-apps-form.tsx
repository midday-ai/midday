"use client";

import { Icons } from "@midday/ui/icons";
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
      disabled
      type="submit"
      className="absolute right-2 h-7 bg-white top-2 px-4 rounded-md font-medium text-sm z-10 text-black"
    >
      Join
    </button>
  );
}

export function SignupAppsForm() {
  return (
    <form
      action={async (formData) => {
        // await addEmail(formData);
        // setSubmitted(true);
      }}
    >
      <fieldset className="relative w-[330px]">
        <input
          placeholder="Enter your email"
          type="email"
          name="email"
          id="email"
          autoComplete="email"
          aria-label="Email address"
          required
          className="border bg-transparent border-[#2C2C2C] font-sm text-white outline-none w-full py-1 px-3 placeholder-[#606060] rounded-lg h-11"
        />
        <SubmitButton />
      </fieldset>
    </form>
  );
}
