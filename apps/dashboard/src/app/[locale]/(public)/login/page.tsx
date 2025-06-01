import { AppleSignIn } from "@/components/apple-sign-in";
import { ConsentBanner } from "@/components/consent-banner";
import { GithubSignIn } from "@/components/github-sign-in";
import { GoogleSignIn } from "@/components/google-sign-in";
import { OTPSignIn } from "@/components/otp-sign-in";
import { Cookies } from "@/utils/constants";
import { isEU } from "@midday/location";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { userAgent } from "next/server";
import background from "public/assets/bg-login.jpg";

export const metadata: Metadata = {
  title: "Login | Midday",
};

export default async function Page() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get(Cookies.PreferredSignInProvider);
  const showTrackingConsent =
    (await isEU()) && !cookieStore.has(Cookies.TrackingConsent);
  const { device } = userAgent({ headers: await headers() });

  let moreSignInOptions = null;
  let preferredSignInOption =
    device?.vendor === "Apple" ? (
      <div className="flex flex-col space-y-2">
        <GoogleSignIn />
        <AppleSignIn />
      </div>
    ) : (
      <GoogleSignIn />
    );

  switch (preferred?.value) {
    case "apple":
      preferredSignInOption = <AppleSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <GithubSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "github":
      preferredSignInOption = <GithubSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "google":
      preferredSignInOption = <GoogleSignIn />;
      moreSignInOptions = (
        <>
          <AppleSignIn />
          <GithubSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "otp":
      preferredSignInOption = <OTPSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <GithubSignIn />
        </>
      );
      break;

    default:
      if (device?.vendor === "Apple") {
        moreSignInOptions = (
          <>
            <GithubSignIn />
            <OTPSignIn className="border-t-[1px] border-border pt-8" />
          </>
        );
      } else {
        moreSignInOptions = (
          <>
            <AppleSignIn />
            <GithubSignIn />
            <OTPSignIn className="border-t-[1px] border-border pt-8" />
          </>
        );
      }
  }

  return (
    <div className="h-screen p-2">
      {/* Header - Logo */}
      <header className="absolute top-0 left-0 z-30 w-full">
        <div className="p-6 md:p-8">
          <Link href="https://midday.ai">
            <Icons.LogoSmall className="h-8 w-auto text-white" />
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-full">
        {/* Background Image Section - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <Image
            src={background}
            alt="Background"
            className="object-cover"
            priority
            fill
          />
        </div>

        {/* Login Form Section */}
        <div className="w-full lg:w-1/2 relative">
          {/* Form Content */}
          <div className="relative z-10 flex h-full items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
              {/* Welcome Section */}
              <div className="text-center">
                <h1 className="text-lg mb-4 font-serif">Welcome to Midday</h1>
                <p className="text-[#878787] text-sm mb-8">
                  New here or coming back? Choose how you want to continue
                </p>
              </div>

              {/* Sign In Options */}
              <div className="space-y-4">
                {/* Primary Sign In Option */}
                <div className="space-y-3">{preferredSignInOption}</div>

                <div className="flex items-center justify-center">
                  <span className="text-[#878787] text-sm">Or</span>
                </div>

                {/* More Options Accordion */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-0">
                    <AccordionTrigger className="flex justify-center items-center text-sm py-2 hover:no-underline">
                      <span>Other options</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-3">{moreSignInOptions}</div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Terms and Privacy */}
              <div className="text-center absolute bottom-4 left-0 right-0">
                <p className="text-xs text-[#878787] leading-relaxed font-mono">
                  By signing in you agree to our{" "}
                  <Link href="https://midday.ai/terms" className="underline">
                    Terms of service
                  </Link>{" "}
                  &{" "}
                  <Link href="https://midday.ai/policy" className="underline">
                    Privacy policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consent Banner */}
      {showTrackingConsent && <ConsentBanner />}
    </div>
  );
}
