import { EmailPasswordSignIn } from "@/components/email-password-sign-in";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LoginAccordion } from "@/components/login-accordion";
import { LoginVideoBackground } from "@/components/login-video-background";
import { OTPSignIn } from "@/components/otp-sign-in";
import { Cookies } from "@/utils/constants";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | Abacus",
};

export default async function Page() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get(Cookies.PreferredSignInProvider);

  let moreSignInOptions = null;
  let preferredSignInOption = (
    <GoogleSignIn
      showLastUsed={!preferred?.value || preferred?.value === "google"}
    />
  );

  switch (preferred?.value) {
    case "google":
      preferredSignInOption = <GoogleSignIn showLastUsed={true} />;
      moreSignInOptions = (
        <>
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
          <EmailPasswordSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "otp":
      preferredSignInOption = <OTPSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <EmailPasswordSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "password":
      preferredSignInOption = <EmailPasswordSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    default:
      moreSignInOptions = (
        <>
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
          <EmailPasswordSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
  }

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Logo - Fixed position matching website header exactly */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none">
        <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 active:opacity-80 transition-opacity duration-200 pointer-events-auto"
          >
            <div className="w-6 h-6">
              <Icons.LogoSmall className="w-full h-full text-foreground" />
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
              <h1 className="text-lg mb-4 font-serif">Welcome to Abacus</h1>
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
                href="/terms"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Terms of service
              </Link>{" "}
              &{" "}
              <Link
                href="/policy"
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
