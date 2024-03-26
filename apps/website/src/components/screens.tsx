"use client";

import { AdaptiveImage } from "@/components/adaptive-image";
import { useRouter } from "next/navigation";
import screen1Light from "public/screen-1-light.png";
import screen1 from "public/screen-1.png";
import screen2Light from "public/screen-2-light.png";
import screen2 from "public/screen-2.png";
import screen3Light from "public/screen-3-light.png";
import screen3 from "public/screen-3.png";
import screen4Light from "public/screen-4-light.png";
import screen4 from "public/screen-4.png";
import screen5Light from "public/screen-5-light.png";
import screen5 from "public/screen-5.png";
import { useState } from "react";
import { BlurryCircle } from "./blurry-circle";
import { CalEmbed } from "./cal-embed";
import { CardStack } from "./card-stack";
import { Dock } from "./dock";

export function Screens() {
  const router = useRouter();
  const [activeApp, setActiveApp] = useState<"cal" | "midday">("midday");

  const apps = [
    {
      id: "finder",
      icon: require("public/dock/finder.png"),
      name: "Finder",
    },
    {
      id: "midday",
      icon: require("public/dock/midday.png"),
      name: "Midday",
      onClick: () => setActiveApp("midday"),
    },
    {
      id: "cal",
      icon: require("public/dock/cal.png"),
      name: "Talk to us",
      onClick: () => setActiveApp("cal"),
    },
    {
      id: "notion",
      icon: require("public/dock/notion.png"),
      name: "Open Roadmap",
      onClick: () => router.push("https://go.midday.ai/4bHhyra", {}),
    },
    {
      id: "discord",
      icon: require("public/dock/discord.png"),
      name: "Join the comunity",
      onClick: () =>
        window.open(
          "https://go.midday.ai/anPiuRx",
          "_blank",
          "noopener,noreferrer"
        ),
    },
    {
      id: "github",
      icon: require("public/dock/github.png"),
      name: "Open Repository",
      onClick: () =>
        window.open("https://git.new/midday", "_blank", "noopener,noreferrer"),
    },
  ];

  const renderActiveApp = () => {
    switch (activeApp) {
      case "midday":
        return (
          <div className="relative">
            <BlurryCircle className="absolute -top-2 right-[320px]  hidden md:block bg-[#FFECBB] dark:bg-[#FFECBB]/40" />
            <BlurryCircle className="absolute -bottom-6 left-6 hidden md:block bg-[#FFECBB]/50 dark:bg-[#FFECBB]/20" />
            <BlurryCircle className="absolute -bottom-[60px] right-0 bg-[#3633D0]/5 dark:bg-[#3633D0]/10 -z-10 hidden md:block" />

            <CardStack
              items={[
                {
                  id: 1,
                  name: "Overview",
                  content: (
                    <AdaptiveImage
                      quality={100}
                      alt="Dashboard - Overview"
                      darkSrc={screen1}
                      lightSrc={screen1Light}
                      width={1031}
                      height={670}
                      priority
                    />
                  ),
                },
                {
                  id: 2,
                  name: "Tracker",
                  content: (
                    <AdaptiveImage
                      quality={100}
                      alt="Dashboard - Tracker"
                      darkSrc={screen2}
                      lightSrc={screen2Light}
                      width={1031}
                      height={670}
                    />
                  ),
                },
                {
                  id: 3,
                  name: "Inbox",
                  content: (
                    <AdaptiveImage
                      quality={100}
                      alt="Dashboard - Inbox"
                      darkSrc={screen3}
                      lightSrc={screen3Light}
                      width={1031}
                      height={670}
                    />
                  ),
                },
                {
                  id: 4,
                  name: "Vault",
                  content: (
                    <AdaptiveImage
                      quality={100}
                      alt="Dashboard - Vault"
                      darkSrc={screen4}
                      lightSrc={screen4Light}
                      width={1031}
                      height={670}
                    />
                  ),
                },
                {
                  id: 5,
                  name: "Dashboard - Transactions",
                  content: (
                    <AdaptiveImage
                      quality={100}
                      alt="Dashboard - Transactions"
                      darkSrc={screen5}
                      lightSrc={screen5Light}
                      width={1031}
                      height={670}
                    />
                  ),
                },
              ]}
            />
          </div>
        );
      case "cal":
        return (
          <div className="w-full max-h-[760px] overflow-auto md:h-[600px] md:mt-[70px]">
            <CalEmbed calLink="pontus-midday/15min" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center mt-12 md:mt-14 flex-col">
      {renderActiveApp()}

      <div className="mt-8">
        <Dock apps={apps} />
      </div>
    </div>
  );
}
