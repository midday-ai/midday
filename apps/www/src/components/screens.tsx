"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import appIcon from "public/app-icon.png";
import cal from "public/dock/cal.png";
import calendly from "public/dock/calendly.png";
import discoord from "public/dock/discord.png";
import finder from "public/dock/finder.png";
import notion from "public/dock/notion.png";
import screen1 from "public/screen-1.png";
import screen2 from "public/screen-2.png";
import screen3 from "public/screen-3.png";
import screen4 from "public/screen-4.png";
import screen5 from "public/screen-5.png";

import { CardStack } from "./card-stack";

export function Screens() {
  const router = useRouter();
  const [activeApp, setActiveApp] = useState<"cal" | "solomonai">("solomonai");

  const apps = [
    {
      id: "finder",
      icon: finder,
      name: "Finder",
    },
    {
      id: "solomonai",
      icon: appIcon,
      name: "Solomon AI",
      onClick: () => setActiveApp("solomonai"),
    },
    {
      id: "cal",
      icon: cal,
      name: "Schedule A Demo",
      onClick: () => setActiveApp("cal"),
    },
    {
      id: "notion",
      icon: notion,
      name: "Open Roadmap",
      onClick: () => router.push("https://shorturl.at/dpAJ2", {}),
    },
    {
      id: "discord",
      icon: discoord,
      name: "Join the community",
      onClick: () =>
        window.open(
          "https://discord.gg/xHwWKjf9",
          "_blank",
          "noopener,noreferrer",
        ),
    },
    {
      id: "calendly",
      icon: calendly,
      name: "Book A Meeting",
      onClick: () =>
        window.open(
          "https://calendly.com/yoanyomba/30min",
          "_blank",
          "noopener,noreferrer",
        ),
    },
  ];

  return (
    <div className="relative mt-20 pb-16 pt-12 md:mt-[250px]">
      <div className="relative z-10 flex flex-col items-center">
        <div className="pb-14 text-center">
          <h3 className="text-4xl font-medium md:text-6xl">
            The visibility you need
          </h3>
          <p className="mt-4 text-[#878787]">
            Providing visibility into your practice's financial health.
          </p>
        </div>

        <CardStack
          items={[
            {
              id: 1,
              name: "Overview",
              content: (
                <Image
                  quality={100}
                  alt="Dashboard - Overview"
                  src={screen1}
                  width={1031}
                  height={670}
                  priority
                  className="border border-border"
                />
              ),
            },
            {
              id: 2,
              name: "Tracker",
              content: (
                <Image
                  quality={100}
                  alt="Dashboard - Tracker"
                  src={screen2}
                  width={1031}
                  height={670}
                  className="border border-border"
                />
              ),
            },
            {
              id: 3,
              name: "Inbox",
              content: (
                <Image
                  quality={100}
                  alt="Dashboard - Inbox"
                  src={screen3}
                  width={1031}
                  height={670}
                  className="border border-border"
                />
              ),
            },
            {
              id: 4,
              name: "Vault",
              content: (
                <Image
                  quality={100}
                  alt="Dashboard - Vault"
                  src={screen4}
                  width={1031}
                  height={670}
                  className="border border-border"
                />
              ),
            },
            {
              id: 5,
              name: "Dashboard - Transactions",
              content: (
                <Image
                  quality={100}
                  alt="Dashboard - Transactions"
                  src={screen5}
                  width={1031}
                  height={670}
                  className="border border-border"
                />
              ),
            },
          ]}
        />
      </div>

      <div className="dotted-bg absolute -left-[5000px] top-0 h-full w-[10000px]" />
    </div>
  );
}
