import { AppleSignIn } from "@/components/apple-sign-in";
import { ConsentBanner } from "@/components/consent-banner";
import { GithubSignIn } from "@/components/github-sign-in";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LoginAccordion } from "@/components/login-accordion";
import LoginTestimonials from "@/components/login-testimonials";
import { OTPSignIn } from "@/components/otp-sign-in";
import { Cookies } from "@/utils/constants";
import { isEU } from "@midday/location";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { userAgent } from "next/server";

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
      <div className="flex flex-col space-y-3">
        <GoogleSignIn showLastUsed={preferred?.value === "google"} />
        <AppleSignIn showLastUsed={preferred?.value === "apple"} />
      </div>
    ) : (
      <GoogleSignIn
        showLastUsed={!preferred?.value || preferred?.value === "google"}
      />
    );

  switch (preferred?.value) {
    case "apple":
      preferredSignInOption = <AppleSignIn showLastUsed={true} />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <GithubSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "github":
      preferredSignInOption = <GithubSignIn showLastUsed={true} />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "google":
      preferredSignInOption = <GoogleSignIn showLastUsed={true} />;
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
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Video Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden m-2">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source
            src="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/videos/login-video.webm"
            type="video/webm"
          />
        </video>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Logo */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="p-4">
            <Icons.LogoSmall className="h-6 w-auto text-white" />
          </div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center items-center p-2 text-center h-full w-full">
          <div className="max-w-lg">
            <LoginTestimonials />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 pb-2">
        <div className="w-full max-w-md flex flex-col h-full">
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-lg mb-4 font-serif">Welcome to Midday</h1>
              <p className="font-sans text-sm text-[#878787]">
                Sign in to your account to continue
              </p>
            </div>

            {/* Sign In Options */}
            <div className="space-y-3 flex items-center justify-center">
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

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="font-sans text-sm text-[#878787]">
                Don't have an account?{" "}
                <Link
                  href="#"
                  className="text-foreground hover:text-[#878787] transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
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

      {/* Consent Banner */}
      {showTrackingConsent && <ConsentBanner />}
    </div>
  );
}
