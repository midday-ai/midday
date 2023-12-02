"use client";

import { subscribeEmail } from "@/actions/subscribeEmail";
import { useScopedI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import mobileLight from "public/mobile-light.png";
import mobile from "public/mobile.png";
import overviewLight from "public/overview-light.png";
import overview from "public/overview.png";
import searchLight from "public/search-light.png";
import search from "public/search.png";
import trackingLight from "public/tracking-light.png";
import tracking from "public/tracking.png";
import transactionsLight from "public/transactions-light.png";
import transactions from "public/transactions.png";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Header } from "./header";

function SubmitButton() {
  const t = useScopedI18n("startpage");
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
      {t("join")}
    </button>
  );
}

export function StartPage() {
  const t = useScopedI18n("startpage");
  const [isSubmitted, setSubmitted] = useState(false);

  return (
    <div className="relative">
      <Header />
      <div className="px-5 lg:px-10">
        <div className="text-center mt-16 md:mt-20">
          <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
            <h1 className="font-medium pb-1 text-5xl">{t("title")}</h1>
          </div>
          <p className="text-[#696969] dark:text-[#B0B0B0]">
            {t("description")}
          </p>
        </div>

        <div className="flex justify-center mt-8">
          {isSubmitted ? (
            <div className="border border border-[#2C2C2C] font-sm text-primary h-11 rounded-lg w-[330px] flex items-center py-1 px-3 justify-between">
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
              <fieldset className="relative z-50">
                <input
                  placeholder={t("email")}
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  aria-label="Email address"
                  required
                  className="bg-background font-sm text-primary outline-none py-1 px-3 w-[360px] placeholder-[#606060] rounded-lg h-11 border border-color-[#DCDAD2]"
                />
                <SubmitButton />
              </fieldset>
            </form>
          )}
        </div>
      </div>

      <div className="w-full">
        <div className="md:h-[730px] dark:md:h-[830px] flex">
          <div className="grid md:grid-cols-6 grid-cols-3 gap-[32px] m-auto mt-12">
            <div className="w-[100px] text-center leading-tight">
              <div className="w-[100px] h-[65px] border border-[#2C2C2C] rounded-lg mb-2 flex items-center justify-center">
                <Icons.OpenSource />
              </div>
              <span className="text-[#606060] text-sm">{t("open")}</span>
            </div>
            <div className="w-[100px] text-center leading-tight">
              <div className="w-[100px] h-[65px] border border-[#2C2C2C] rounded-lg mb-2 flex items-center justify-center">
                <Icons.ChartGantt />
              </div>
              <span className="text-[#606060] text-sm">{t("live")}</span>
            </div>
            <div className="w-[100px] text-center leading-tight">
              <div className="w-[100px] h-[65px] border border-[#2C2C2C] rounded-lg mb-2 flex items-center justify-center">
                <Icons.FileDocument />
              </div>
              <span className="text-[#606060] text-sm">{t("document")}</span>
            </div>
            <div className="w-[100px] text-center leading-tight">
              <div className="w-[100px] h-[65px] border border-[#2C2C2C] rounded-lg mb-2 flex items-center justify-center">
                <Icons.ReceiptText />
              </div>
              <span className="text-[#606060] text-sm">{t("reciept")}</span>
            </div>
            <div className="w-[100px] text-center leading-tight">
              <div className="w-[100px] h-[65px] border border-[#2C2C2C] rounded-lg mb-2 flex items-center justify-center">
                <Icons.TimeCog />
              </div>
              <span className="text-[#606060] text-sm">{t("time")}</span>
            </div>
            <div className="w-[100px] text-center leading-tight">
              <div className="w-[100px] h-[65px] border border-[#2C2C2C] rounded-lg mb-2 flex items-center justify-center">
                <Icons.CreationOutline />
              </div>
              <span className="text-[#606060] text-sm">{t("ai")}</span>
            </div>
          </div>

          <div className="w-[1px] h-[1px] bg-primary invisible md:visible rounded-full absolute top-[35%] left-[5%] animate-[pulse_2s_ease-in-out_infinite]" />
          <div
            className="w-[5px] h-[5px] bg-primary invisible md:visible rounded-full absolute top-[44%] left-[10%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "500ms" }}
          />
          <div
            className="w-[1px] h-[1px] bg-primary invisible md:visible rounded-full absolute top-[41%] left-[15%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-[2px] h-[2px] bg-primary invisible md:visible rounded-full absolute top-[39%] left-[25%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "700ms" }}
          />
          <div
            className="w-[5px] h-[5px] bg-[#22FF66] rounded-full invisible md:visible absolute top-[34%] left-[30%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="w-[1px] h-[1px] bg-primary invisible md:visible rounded-full absolute top-[45%] left-[44%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "400ms" }}
          />

          <div
            className="w-[5px] h-[5px] bg-primary invisible md:visible rounded-full absolute top-[54%] right-[5%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="w-[3px] h-[3px] bg-[#8306FF] rounded-full invisible md:visible absolute top-[60%] right-[10%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "4s" }}
          />
          <div
            className="w-[5px] h-[5px] bg-primary invisible md:visible rounded-full absolute top-[50%] right-[20%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "200ms" }}
          />
          <div
            className="w-[2px] h-[2px] bg-primary invisible md:visible rounded-full absolute top-[59%] right-[27%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "50ms" }}
          />
          <div
            className="w-[5px] h-[5px] bg-primary invisible md:visible rounded-full absolute top-[40%] right-[24%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "10ms" }}
          />
          <div
            className="w-[3px] h-[3px] bg-primary invisible md:visible rounded-full absolute top-[53%] right-[32%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "100ms" }}
          />
          <div
            className="w-[5px] h-[5px] bg-primary invisible md:visible rounded-full absolute top-[50%] right-[40%] animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: "190ms" }}
          />
        </div>
        <div className="w-full absolute bottom-0 right-0 left-0">
          <Image
            quality={100}
            src={mobile}
            alt="Midday | Mobile"
            width={393}
            className="absolute left-0 right-0 hidden dark:block dark:md:hidden"
            height={393}
            style={{
              objectFit: "contain",
            }}
          />

          <Image
            quality={100}
            loading="eager"
            src={overview}
            alt="Midday | Overview"
            width={993}
            className="absolute left-0 bottom-0 hidden dark:md:block"
            height={645}
            style={{
              objectFit: "contain",
            }}
          />

          <Image
            quality={100}
            src={search}
            alt="Midday | Search"
            width={638}
            height={260}
            className="absolute left-[50%] -ml-[319px] z-10 bottom-0 hidden dark:md:block"
          />

          <Image
            quality={100}
            src={tracking}
            alt="Midday | Tracking"
            width={360}
            height={268}
            className="absolute right-[20%] z-10 bottom-[240px] hidden dark:md:block"
          />

          <Image
            quality={100}
            className="absolute right-0 bottom-0 hidden dark:md:block"
            src={transactions}
            alt="Midday | Transactions"
            width={993}
            height={645}
            style={{
              objectFit: "contain",
            }}
          />

          <Image
            quality={100}
            src={mobileLight}
            alt="Midday | Mobile"
            width={393}
            className="absolute left-0 right-0 block md:hidden dark:hidden"
            height={393}
            style={{
              objectFit: "contain",
            }}
          />

          <Image
            quality={100}
            loading="eager"
            src={overviewLight}
            alt="Midday | Overview"
            width={993}
            className="absolute left-0 bottom-0 hidden md:block dark:hidden"
            height={645}
            style={{
              objectFit: "contain",
            }}
          />

          <Image
            quality={100}
            src={searchLight}
            alt="Midday | Search"
            width={638}
            height={260}
            className="absolute left-[50%] -ml-[319px] z-10 bottom-0 hidden md:block dark:hidden"
          />

          <Image
            quality={100}
            src={trackingLight}
            alt="Midday | Tracking"
            width={360}
            height={268}
            className="absolute right-[22%] z-10 bottom-[180px] hidden md:block dark:hidden"
          />

          <Image
            quality={100}
            className="absolute right-0 bottom-0 hidden md:block dark:hidden"
            src={transactionsLight}
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
