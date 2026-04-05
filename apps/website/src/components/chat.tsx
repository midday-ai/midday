"use client";

import { ChatIMessageAnimation } from "./chat-imessage-animation";
import { TextLoop } from "./text-loop";
import { IPhoneMock } from "./iphone-mock";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { PricingSection } from "./sections/pricing-section";
import { TestimonialsSection } from "./sections/testimonials-section";

const PHONE_W = 418;
const PHONE_H = 890;
const MOBILE_SCALE = 0.6;
const FADE_GRADIENT =
  "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 15%, hsla(var(--background), 0.8) 40%, hsla(var(--background), 0.4) 65%, transparent 100%)";

function PlatformIcons() {
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <div className="flex items-center gap-2.5">
        <a
          href="/chat/imessage"
          className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-foreground transition-all duration-200"
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.4 6.8c0-2.2 1.6-4 3.7-4.4C7.4 2.1 9 2 12 2c3 0 4.6.1 5.9.4 2.1.4 3.7 2.2 3.7 4.4v5.4c0 2.2-1.6 4-3.7 4.4-.8.2-1.8.3-3.2.3l-3.2 3.5c-.7.8-2 .3-2-.7v-2.8c-1.3 0-2.2-.1-2.9-.3-2.1-.4-3.7-2.2-3.7-4.4V6.8z" />
          </svg>
        </a>
        <a
          href="/chat/whatsapp"
          className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-foreground transition-all duration-200"
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
        <a
          href="/chat/slack"
          className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-foreground transition-all duration-200"
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
          </svg>
        </a>
        <a
          href="/chat/telegram"
          className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-foreground transition-all duration-200"
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <IPhoneMock>
      <ChatIMessageAnimation />
    </IPhoneMock>
  );
}

export function Chat() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative overflow-visible lg:overflow-hidden">
        <div className="flex flex-col relative pt-32 pb-0 md:pt-24 lg:pt-0 overflow-hidden">
          <div className="flex-1 lg:flex-none flex flex-col justify-center md:justify-start lg:pt-48 items-center space-y-8 lg:space-y-0 z-20 px-3 sm:px-4 lg:px-0 lg:max-w-[1400px] lg:mx-auto lg:w-full lg:mb-12">
            <div className="flex flex-col items-center w-full text-center space-y-6 lg:space-y-8">
              <div className="space-y-5 lg:space-y-6 max-w-3xl 3xl:max-w-5xl mx-auto px-2 lg:px-0">
                <h1 className="font-serif text-3xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl 2xl:text-7xl 3xl:text-8xl leading-[1.1] tracking-tight text-foreground">
                  Run your business
                  <br />
                  from{" "}
                  <TextLoop interval={3} transition={{ duration: 0.3 }}>
                    <span>iMessage</span>
                    <span>WhatsApp</span>
                    <span>Slack</span>
                    <span>Telegram</span>
                  </TextLoop>
                </h1>

                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed font-sans max-w-xl mx-auto">
                  Get invoices paid, track time, manage expenses &mdash; right
                  from your favorite chat app.
                </p>
              </div>

              <PlatformIcons />
            </div>
          </div>

          {/* iPhone mock */}
          <div className="mt-8 lg:mt-0 flex justify-center w-full">
            {/* Mobile */}
            <div className="lg:hidden flex justify-center w-full">
              <div
                className="relative overflow-hidden"
                style={{
                  width: Math.round(PHONE_W * MOBILE_SCALE),
                  height: Math.round(PHONE_H * MOBILE_SCALE * 0.75),
                }}
              >
                <div
                  className="absolute top-0 left-0 origin-top-left"
                  style={{ transform: `scale(${MOBILE_SCALE})` }}
                >
                  <PhoneMock />
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-[30%] z-10 pointer-events-none"
                  style={{ background: FADE_GRADIENT }}
                />
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden lg:flex justify-center w-full">
              <div className="relative">
                <div
                  className="absolute bottom-0 left-0 right-0 h-[25%] z-10 pointer-events-none"
                  style={{ background: FADE_GRADIENT }}
                />
                <PhoneMock />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <FeaturesGridSection />

      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <TestimonialsSection />

      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <PricingSection />
    </div>
  );
}
