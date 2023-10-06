"use client";

import { addEmail } from "@/actions/addEmail";
import Image from "next/image";
import overview from "public/overview.png";
import search from "public/search.png";
import transactions from "public/transactions.png";
import { useState } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { Logo } from "./logo";

function SubmitButton() {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <svg
        aria-hidden="true"
        role="status"
        className="absolute w-4 h-4 mr-3 text-black animate-spin top-2 right-2"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="#E5E7EB"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <button
      type="submit"
      className="absolute right-2 h-6 bg-white top-2 px-4 rounded-md font-medium text-sm z-10"
    >
      Join
    </button>
  );
}

export function StartPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      <div className="px-5 lg:px-10">
        <header className="py-10 flex justify-between">
          <Logo />

          <button type="button" className="text-white px-8 h-[38px] btn">
            Sign in
          </button>
        </header>

        <div className="text-center mt-20">
          <h1 className="font-bold pb-1 text-white font-size text-5xl mb-4 bg-gradient-to-r from-white via-white to-[#848484] inline-block text-transparent bg-clip-text">
            Smart pre-accounting
          </h1>
          <p className="text-[#B0B0B0]">
            Introducing our open-source pre-accounting tool. Automate financial
            tasks, stay <br />
            organized, and make informed decisions effortlessly. Experience the
            future of pre-
            <br />
            accounting today!
          </p>
        </div>

        <div className="flex justify-center mt-8">
          {submitted ? (
            <div className="border border-[#2C2C2C] font-sm text-white h-10 rounded-lg w-[300px] flex items-center py-1 px-3 justify-between">
              <p>Subscribed!</p>

              <svg
                width="17"
                height="17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m14.546 4.724-8 8-3.667-3.667.94-.94 2.727 2.72 7.06-7.053.94.94Z"
                  fill="#fff"
                />
              </svg>
            </div>
          ) : (
            <form
              action={async (formData) => {
                await addEmail(formData);
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
                  className="border bg-transparent border-[#2C2C2C] font-sm text-white outline-none py-1 px-3 w-[300px] placeholder-[#606060] rounded-lg h-10"
                />
                <SubmitButton />
              </fieldset>
            </form>
          )}
        </div>
      </div>

      <div className="flex w-full">
        <div className="w-[1px] h-[1px] bg-white rounded-full absolute top-[35%] left-[5%]" />
        <div className="w-[5px] h-[5px] bg-white rounded-full absolute top-[44%] left-[10%]" />
        <div className="w-[1px] h-[1px] bg-white rounded-full absolute top-[41%] left-[15%]" />
        <div className="w-[2px] h-[2px] bg-white rounded-full absolute top-[39%] left-[25%]" />
        <div className="w-[5px] h-[5px] bg-[#22FF66] rounded-full absolute top-[44%] left-[30%]" />
        <div className="w-[1px] h-[1px] bg-white rounded-full absolute top-[45%] left-[44%]" />

        <div className="w-[5px] h-[5px] bg-white rounded-full absolute top-[54%] right-[5%]" />
        <div className="w-[3px] h-[3px] bg-[#8306FF] rounded-full absolute top-[60%] right-[10%]" />
        <div className="w-[5px] h-[5px] bg-white rounded-full absolute top-[50%] right-[20%]" />
        <div className="w-[2px] h-[2px] bg-white rounded-full absolute top-[59%] right-[27%]" />
        <div className="w-[5px] h-[5px] bg-white rounded-full absolute top-[47%] right-[29%]" />
        <div className="w-[3px] h-[3px] bg-white rounded-full absolute top-[53%] right-[32%]" />
        <div className="w-[5px] h-[5px] bg-white rounded-full absolute top-[50%] right-[40%]" />

        <div className="flex-1 relative">
          <Image
            src={transactions}
            alt="Midday | Transactions"
            width={993}
            height={645}
            style={{
              objectFit: "contain",
            }}
          />
        </div>

        <Image
          src={search}
          alt="Midday | Search"
          width={638}
          height={260}
          className="absolute left-[50%] -ml-[319px] z-10 -bottom-12"
        />

        <div className="flex-1 relative">
          <Image
            className="absolute right-0 bottom-0"
            src={overview}
            alt="Midday | Overview"
            width={993}
            height={645}
            style={{
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </div>
  );
}
