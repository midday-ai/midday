"use client";

import { subscribeEmail } from "@/actions/subscribeEmail";
import { useScopedI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import overview from "public/overview.png";
import search from "public/search.png";
import transactions from "public/transactions.png";
import { useState } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

function SubmitButton() {
  const t = useScopedI18n("startpage");
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <div className="absolute top-1 right-0">
        <Loader2 className="absolute w-4 h-4 mr-3 text-black animate-spin top-2.5 right-2" />
      </div>
    );
  }

  return (
    <button
      type="submit"
      className="absolute right-2 h-7 bg-white top-2 px-4 rounded-md font-medium text-sm z-10 text-black"
    >
      {t("join")}
    </button>
  );
}

export function StartPage() {
  const t = useScopedI18n("startpage");
  const [isSubmitted, setSubmitted] = useState(false);

  return (
    <div>
      <div className="px-5 lg:px-10">
        <header className="py-10 flex justify-between">
          <Link href="/">
            <Icons.Logo />
          </Link>

          <Link href="https://app.midday.ai">
            <button
              type="button"
              className="relative rounded-lg overflow-hidden p-[1px]"
              style={{
                background:
                  "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #848f9c 50%, rgba(235,248,255,.18) 100%)",
              }}
            >
              <span className="flex items-center gap-4 py-1 px-2 rounded-[7px] bg-background text-white px-8 h-[39px] h-full font-normal">
                {t("signIn")}
              </span>
            </button>
          </Link>
        </header>

        <div className="text-center mt-20">
          <div className="pb-4 bg-gradient-to-r from-white via-white to-[#848484] inline-block text-transparent bg-clip-text">
            <h1 className="font-medium pb-1 text-5xl">{t("title")}</h1>
          </div>
          <p className="text-[#B0B0B0]">{t("description")}</p>
        </div>

        <div className="flex justify-center mt-8">
          {isSubmitted ? (
            <div className="border border-[#2C2C2C] font-sm text-white h-11 rounded-lg w-[330px] flex items-center py-1 px-3 justify-between">
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
                await subscribeEmail(formData, "pre-launch");
                setSubmitted(true);
              }}
            >
              <fieldset className="relative">
                <input
                  placeholder={t("email")}
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  aria-label="Email address"
                  required
                  className="border bg-transparent border-[#2C2C2C] font-sm text-white outline-none py-1 px-3 w-[360px] placeholder-[#606060] rounded-lg h-11"
                />
                <SubmitButton />
              </fieldset>
            </form>
          )}
        </div>
      </div>

      <div className="flex w-full">
        <div className="w-[1px] h-[1px] bg-white rounded-full absolute top-[35%] left-[5%] animate-[pulse_2s_ease-in-out_infinite]" />
        <div
          className="w-[5px] h-[5px] bg-white rounded-full absolute top-[44%] left-[10%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "500ms" }}
        />
        <div
          className="w-[1px] h-[1px] bg-white rounded-full absolute top-[41%] left-[15%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-[2px] h-[2px] bg-white rounded-full absolute top-[39%] left-[25%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "700ms" }}
        />
        <div
          className="w-[5px] h-[5px] bg-[#22FF66] rounded-full absolute top-[44%] left-[30%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="w-[1px] h-[1px] bg-white rounded-full absolute top-[45%] left-[44%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "400ms" }}
        />

        <div
          className="w-[5px] h-[5px] bg-white rounded-full absolute top-[54%] right-[5%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="w-[3px] h-[3px] bg-[#8306FF] rounded-full absolute top-[60%] right-[10%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="w-[5px] h-[5px] bg-white rounded-full absolute top-[50%] right-[20%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "200ms" }}
        />
        <div
          className="w-[2px] h-[2px] bg-white rounded-full absolute top-[59%] right-[27%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "50ms" }}
        />
        <div
          className="w-[5px] h-[5px] bg-white rounded-full absolute top-[47%] right-[29%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "10ms" }}
        />
        <div
          className="w-[3px] h-[3px] bg-white rounded-full absolute top-[53%] right-[32%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "100ms" }}
        />
        <div
          className="w-[5px] h-[5px] bg-white rounded-full absolute top-[50%] right-[40%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ animationDelay: "190ms" }}
        />

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
