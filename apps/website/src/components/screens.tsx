import { AdaptiveImage } from "@/components/adaptive-image";
import screen1Light from "public/screen-1-light.png";
import screen1 from "public/screen-1.png";
import screen2Light from "public/screen-2-light.png";
import screen2 from "public/screen-2.png";
import screen3Light from "public/screen-3-light.png";
import screen3 from "public/screen-3.png";
import screen4Light from "public/screen-4-light.png";
import screen4 from "public/screen-4.png";
import { BlurryCircle } from "./blurry-circle";
import { CardStack } from "./card-stack";
import { Dock } from "./dock";

export function Screens() {
  return (
    <div className="flex items-center justify-center mt-14 flex-col">
      <div className="relative">
        <BlurryCircle className="absolute -top-2 right-[320px] bg-[#FFECBB]/20" />
        <BlurryCircle className="absolute -bottom-6 left-6 bg-[#FFECBB]/5" />

        <CardStack
          items={[
            {
              id: 1,
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
              content: (
                <AdaptiveImage
                  quality={100}
                  alt="Dashboard - Overview"
                  darkSrc={screen2}
                  lightSrc={screen2Light}
                  width={1031}
                  height={670}
                />
              ),
            },
            {
              id: 3,

              content: (
                <AdaptiveImage
                  quality={100}
                  alt="Dashboard - Overview"
                  darkSrc={screen3}
                  lightSrc={screen3Light}
                  width={1031}
                  height={670}
                />
              ),
            },
            {
              id: 4,
              content: (
                <AdaptiveImage
                  quality={100}
                  priority
                  alt="Dashboard - Overview"
                  darkSrc={screen4}
                  lightSrc={screen4Light}
                  width={1031}
                  height={670}
                />
              ),
            },
          ]}
        />
      </div>

      <div className="mt-8">
        <Dock />
      </div>
    </div>
  );
}
