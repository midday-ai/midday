import { AppleSignIn } from "@/components/apple-sign-in";
import { ConsentBanner } from "@/components/consent-banner";
import { DesktopCommandMenuSignIn } from "@/components/desktop-command-menu-sign-in";
import { GithubSignIn } from "@/components/github-sign-in";
import { GoogleSignIn } from "@/components/google-sign-in";
import { OTPSignIn } from "@/components/otp-sign-in";
import { SlackSignIn } from "@/components/slack-sign-in";
import config from "@/config";
import { Cookies } from "@/utils/constants";
import { isEU } from "@midday/location";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Icons } from "@midday/ui/icons";
import ClientSection from "@midday/ui/landing/client-section";
import { FooterSection } from "@midday/ui/landing/footer";
import HeroSection from "@midday/ui/landing/hero";
import { SphereMask } from "@midday/ui/magic";
import Particles from "@midday/ui/magicui/particles";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { userAgent } from "next/server";
import React from "react";

import { featureFlags } from "@internal/env/dashboard";

export const metadata: Metadata = {
  title: `Login | ${config.company}`,
};

type AuthProvider = "apple" | "google" | "github" | "slack" | "otp";

type AuthComponentsType = {
  [key in AuthProvider]: React.ReactElement | null;
};

export default async function Page(params: {
  searchParams: { return_to: string };
}) {
  if (params?.searchParams?.return_to === "desktop/command") {
    return <DesktopCommandMenuSignIn />;
  }

  const cookieStore = cookies();
  const preferred = cookieStore.get(Cookies.PreferredSignInProvider);
  const showTrackingConsent =
    isEU() && !cookieStore.has(Cookies.TrackingConsent);
  const { device } = userAgent({ headers: headers() });

  // Check which auth providers are enabled
  const enabledProviders = featureFlags.authProviders;
  const isAuthEnabled = featureFlags.isAuthEnabled;

  const authComponents: AuthComponentsType = {
    apple:
      isAuthEnabled && enabledProviders.includes("apple") ? (
        <AppleSignIn />
      ) : null,
    google:
      isAuthEnabled && enabledProviders.includes("google") ? (
        <GoogleSignIn />
      ) : null,
    github:
      isAuthEnabled && enabledProviders.includes("github") ? (
        <GithubSignIn />
      ) : null,
    slack:
      isAuthEnabled && enabledProviders.includes("slack") ? (
        <SlackSignIn />
      ) : null,
    otp:
      isAuthEnabled && enabledProviders.includes("otp") ? <OTPSignIn /> : null,
  };

  const defaultProvider: AuthProvider =
    device?.vendor === "Apple" ? "apple" : "google";
  const preferredProvider =
    (preferred?.value as AuthProvider) || defaultProvider;

  // Ensure the preferred provider is available, otherwise fall back to the first available provider
  const availableProviders = Object.keys(authComponents).filter(
    (key) => authComponents[key as AuthProvider] !== null,
  ) as AuthProvider[];
  const actualPreferredProvider = availableProviders.includes(preferredProvider)
    ? preferredProvider
    : availableProviders[0];

  let preferredSignInOption =
    authComponents[actualPreferredProvider as AuthProvider];

  // Filter out the preferred provider and null components
  let moreSignInOptions = availableProviders
    .filter((provider) => provider !== actualPreferredProvider)
    .map((provider) => (
      <React.Fragment key={provider}>{authComponents[provider]}</React.Fragment>
    ));

  // If OTP is available and not the preferred option, ensure it's at the end of the list
  if (authComponents.otp && actualPreferredProvider !== "otp") {
    moreSignInOptions = moreSignInOptions.filter(
      (option) => option.key !== "otp",
    );
    moreSignInOptions.push(
      <OTPSignIn key="otp" className="border-t-[1px] border-border pt-8" />,
    );
  }

  return (
    <div>
      <header className="fixed left-0 right-0 w-full">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href={config.webUrl}>
            <Icons.Logo />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex-1 overflow-hidden">
        <HeroSection
          className="md:mt-[250px] mt-[100px]"
          title={`${config.company} For Business`}
          subtitle={config.description}
          ctaText="Get started today with Solomon AI"
          darkImageSrc=""
          lightImageSrc=""
          announcement={`Introducing ${config.company} For Business`}
        >
          <div className="pointer-events-auto mb-6 mt-6 flex flex-col items-center">
            <div className="w-fit">{preferredSignInOption}</div>

            <Accordion
              type="single"
              collapsible
              className="mt-6 border-t-[1px] pt-2"
            >
              <AccordionItem value="item-1" className="border-0">
                <AccordionTrigger className="flex justify-center space-x-2 text-sm">
                  <span>More options</span>
                </AccordionTrigger>
                <AccordionContent className="mt-4">
                  <div className="flex flex-col space-y-4">
                    {moreSignInOptions}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <p className="text-xs text-[#878787]">
              By clicking continue, you acknowledge that you have read and agree
              to {config.name}'s{" "}
              <a href={`${config.webUrl}/terms`} className="underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href={`${config.webUrl}/policy`} className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </HeroSection>

        <ClientSection />
        <SphereMask />
        <Particles
          className="absolute inset-0 -z-10"
          quantity={50}
          ease={70}
          size={0.05}
          staticity={40}
          color={"#ffffff"}
        />
        <FooterSection
          title={`${config.company} For Business`}
          description={config.description}
        />
      </div>

      {showTrackingConsent && <ConsentBanner />}
    </div>
  );
}
