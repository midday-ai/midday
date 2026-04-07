import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { PricingSection } from "./sections/pricing-section";

type PlatformConfig = {
  name: string;
  slug: string;
  appId: string;
  icon: React.ReactNode;
  description: string;
  steps: { title: string; description: string; href?: string }[];
  notifications: string[];
  capabilities: string[];
  settingsPath: string;
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-xl sm:text-2xl text-foreground">
      {children}
    </h2>
  );
}

export function ChatPlatformPage({ config }: { config: PlatformConfig }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background">
        <div className="pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-sans text-sm"
            >
              <Icons.ArrowBack size={16} />
              All platforms
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 flex items-center justify-center text-muted-foreground">
                {config.icon}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                {config.name}
              </h1>
            </div>

            <div className="mb-12">
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                {config.description}
              </p>
            </div>

            <div className="space-y-12">
              {/* Getting started */}
              <div className="space-y-6">
                <SectionHeading>Getting started</SectionHeading>
                <ol className="space-y-6">
                  {config.steps.map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center font-sans text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-sans text-sm font-medium text-foreground">
                          {step.title}
                        </p>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-1">
                          {step.description}
                          {step.href && (
                            <>
                              {" "}
                              <a
                                href={step.href}
                                className="text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
                              >
                                Open in Midday
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <SectionHeading>Notifications</SectionHeading>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Once connected, you'll receive notifications for:
                </p>
                <ul className="space-y-2">
                  {config.notifications.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 font-sans text-sm text-muted-foreground"
                    >
                      <span className="text-foreground mt-0.5">
                        <Icons.Check size={14} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  All notifications are on by default. To manage them, go to{" "}
                  <span className="text-foreground">{config.settingsPath}</span>{" "}
                  in Midday.
                </p>
              </div>

              {/* Capabilities */}
              <div className="space-y-4">
                <SectionHeading>What you can do</SectionHeading>
                <ul className="space-y-2">
                  {config.capabilities.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 font-sans text-sm text-muted-foreground"
                    >
                      <span className="text-foreground mt-0.5">
                        <Icons.Check size={14} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <FeaturesGridSection />

      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <PricingSection />
    </div>
  );
}
