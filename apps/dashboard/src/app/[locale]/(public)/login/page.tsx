import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { userAgent } from "next/server";
import { LoginAccordion } from "@/components/login-accordion";
import { LoginVideoBackground } from "@/components/login-video-background";
import { OAuthSignIn } from "@/components/oauth-sign-in";
import { OTPSignIn } from "@/components/otp-sign-in";
import { Cookies } from "@/utils/constants";

export const metadata: Metadata = {
  title: "Login | Midday",
};

export default async function Page() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get(Cookies.PreferredSignInProvider);
  const { device } = userAgent({ headers: await headers() });

  let moreSignInOptions = null;
  let preferredSignInOption =
    device?.vendor === "Apple" ? (
      <div className="flex flex-col space-y-3 w-full">
        <OAuthSignIn
          provider="google"
          showLastUsed={preferred?.value === "google"}
        />
        <OAuthSignIn
          provider="apple"
          showLastUsed={preferred?.value === "apple"}
        />
      </div>
    ) : (
      <div className="flex flex-col space-y-3 w-full">
        <OAuthSignIn
          provider="google"
          showLastUsed={!preferred?.value || preferred?.value === "google"}
        />
        <OAuthSignIn
          provider="azure"
          showLastUsed={preferred?.value === "azure"}
        />
      </div>
    );

  switch (preferred?.value) {
    case "apple":
      preferredSignInOption = <OAuthSignIn provider="apple" showLastUsed />;
      moreSignInOptions = (
        <>
          <OAuthSignIn provider="google" />
          <OAuthSignIn provider="azure" />
          <OAuthSignIn provider="github" />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "github":
      preferredSignInOption = <OAuthSignIn provider="github" showLastUsed />;
      moreSignInOptions = (
        <>
          <OAuthSignIn provider="google" />
          <OAuthSignIn provider="apple" />
          <OAuthSignIn provider="azure" />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "google":
      preferredSignInOption = <OAuthSignIn provider="google" showLastUsed />;
      moreSignInOptions = (
        <>
          <OAuthSignIn provider="apple" />
          <OAuthSignIn provider="azure" />
          <OAuthSignIn provider="github" />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "azure":
      preferredSignInOption = <OAuthSignIn provider="azure" showLastUsed />;
      moreSignInOptions = (
        <>
          <OAuthSignIn provider="google" />
          <OAuthSignIn provider="apple" />
          <OAuthSignIn provider="github" />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "otp":
      preferredSignInOption = <OTPSignIn />;
      moreSignInOptions = (
        <>
          <OAuthSignIn provider="google" />
          <OAuthSignIn provider="apple" />
          <OAuthSignIn provider="azure" />
          <OAuthSignIn provider="github" />
        </>
      );
      break;

    default:
      if (device?.vendor === "Apple") {
        moreSignInOptions = (
          <>
            <OAuthSignIn provider="azure" />
            <OAuthSignIn provider="github" />
            <OTPSignIn className="border-t-[1px] border-border pt-8" />
          </>
        );
      } else {
        moreSignInOptions = (
          <>
            <OAuthSignIn provider="apple" />
            <OAuthSignIn provider="github" />
            <OTPSignIn className="border-t-[1px] border-border pt-8" />
          </>
        );
      }
  }

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Logo - Fixed position matching website header exactly */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none">
        <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center">
          <Link
            href="https://midday.ai"
            className="flex items-center gap-2 hover:opacity-80 active:opacity-80 transition-opacity duration-200 pointer-events-auto"
          >
            <div className="w-6 h-6">
              <Icons.LogoSmall className="w-full h-full text-foreground lg:text-white" />
            </div>
          </Link>
        </div>
      </nav>

      {/* Left Side - Video Background */}
      <LoginVideoBackground />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 pb-2">
        <div className="w-full max-w-md flex flex-col h-full">
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-lg lg:text-xl mb-4 font-serif">
                Welcome to Midday
              </h1>
              <p className="font-sans text-sm text-[#878787]">
                Sign in or create an account
              </p>
            </div>

            {/* Sign In Options */}
            <div className="space-y-3 flex items-center justify-center w-full">
              {preferredSignInOption}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background font-sans text-[#878787]">
                  or
                </span>
              </div>
            </div>

            {/* More Options Accordion */}
            <LoginAccordion>{moreSignInOptions}</LoginAccordion>
          </div>

          {/* Terms and Privacy Policy - Bottom aligned */}
          <div className="text-center mt-auto">
            <p className="font-sans text-xs text-[#878787]">
              By signing in you agree to our{" "}
              <Link
                href="https://midday.ai/terms"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Terms of service
              </Link>{" "}
              &{" "}
              <Link
                href="https://midday.ai/policy"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Privacy policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
