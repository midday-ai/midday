"use client";

import { subscribeEmail } from "@/actions/subscribeEmail";
import { useScopedI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import overview from "public/overview.png";
import search from "public/search.png";
import transactions from "public/transactions.png";
import { useState } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { Header } from "./header";

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
    <div className="h-screen relative min-h-[1100px]">
      <Header />
      <div className="px-5 lg:px-10">
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
                  className="bg-[#1A1A1A] font-sm text-white outline-none py-1 px-3 w-[360px] placeholder-[#606060] rounded-lg h-11"
                />
                <SubmitButton />
              </fieldset>
            </form>
          )}
        </div>
      </div>

      <div className="flex w-full">
        <div className="grid md:grid-cols-6 grid-cols-3 gap-[32px] m-auto mt-12">
          <div className="w-[100px] text-center leading-tight">
            <div className="w-[100px] h-[65px] border rounded-lg mb-2 flex items-center justify-center">
              <Icons.OpenSource />
            </div>
            <span className="text-[#606060] text-sm">{t("open")}</span>
          </div>
          <div className="w-[100px] text-center leading-tight">
            <div className="w-[100px] h-[65px] border rounded-lg mb-2 flex items-center justify-center">
              <Icons.ChartGantt />
            </div>
            <span className="text-[#606060] text-sm">{t("live")}</span>
          </div>
          <div className="w-[100px] text-center leading-tight">
            <div className="w-[100px] h-[65px] border rounded-lg mb-2 flex items-center justify-center">
              <Icons.FileDocument />
            </div>
            <span className="text-[#606060] text-sm">{t("document")}</span>
          </div>
          <div className="w-[100px] text-center leading-tight">
            <div className="w-[100px] h-[65px] border rounded-lg mb-2 flex items-center justify-center">
              <Icons.ReceiptText />
            </div>
            <span className="text-[#606060] text-sm">{t("reciept")}</span>
          </div>
          <div className="w-[100px] text-center leading-tight">
            <div className="w-[100px] h-[65px] border rounded-lg mb-2 flex items-center justify-center">
              <Icons.TimeCog />
            </div>
            <span className="text-[#606060] text-sm">{t("time")}</span>
          </div>
          <div className="w-[100px] text-center leading-tight">
            <div className="w-[100px] h-[65px] border rounded-lg mb-2 flex items-center justify-center">
              <Icons.CreationOutline />
            </div>
            <span className="text-[#606060] text-sm">{t("ai")}</span>
          </div>
        </div>

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
          className="w-[5px] h-[5px] bg-[#22FF66] rounded-full absolute top-[34%] left-[30%] animate-[pulse_2s_ease-in-out_infinite]"
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
          className="w-[5px] h-[5px] bg-white rounded-full absolute top-[40%] right-[24%] animate-[pulse_2s_ease-in-out_infinite]"
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

        <div className="absolute bottom-0 w-full">
          <Image
            src={overview}
            alt="Midday | Overview"
            width={993}
            height={645}
            style={{
              objectFit: "contain",
            }}
          />

          <Image
            src={search}
            alt="Midday | Search"
            width={638}
            height={260}
            className="absolute left-[50%] -ml-[319px] z-10 bottom-3"
          />

          <Image
            className="absolute right-0 bottom-0"
            src={transactions}
            alt="Midday | Transactions"
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
